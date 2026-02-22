import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { Types } from "./dbCompat";

type PlainObject = Record<string, any>;
type SortSpec = Record<string, 1 | -1>;
type ProjectionSpec = Record<string, 0 | 1>;

type UpdateSpec = {
  $set?: PlainObject;
  $setOnInsert?: PlainObject;
  $inc?: Record<string, number>;
  $push?: Record<string, unknown>;
};

type FindOneAndUpdateOptions = {
  upsert?: boolean;
  new?: boolean;
};

type AggregateGroupSpec = Record<string, any>;

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeScalar(value: unknown): unknown {
  if (value instanceof Date) return value.getTime();
  if (value && typeof value === "object" && "toString" in (value as any)) {
    const ctorName = (value as any)?.constructor?.name;
    if (ctorName === "ObjectIdCompat") return String(value);
  }
  return value;
}

function valuesEqual(left: unknown, right: unknown) {
  const a = normalizeScalar(left);
  const b = normalizeScalar(right);
  return a === b;
}

function toArray<T>(value: T | T[]) {
  return Array.isArray(value) ? value : [value];
}

function readPathValues(source: unknown, path: string): unknown[] {
  const parts = path.split(".");

  function walk(input: unknown, depth: number): unknown[] {
    if (depth >= parts.length) return [input];
    if (Array.isArray(input)) return input.flatMap((item) => walk(item, depth));
    if (!input || typeof input !== "object") return [undefined];
    return walk((input as PlainObject)[parts[depth]!], depth + 1);
  }

  return walk(source, 0);
}

function readPathValue(source: unknown, path: string) {
  const values = readPathValues(source, path);
  return values.length ? values[0] : undefined;
}

function writePathValue(target: PlainObject, path: string, value: unknown) {
  const parts = path.split(".");
  let node: PlainObject = target;

  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i]!;
    if (!node[key] || typeof node[key] !== "object" || Array.isArray(node[key])) {
      node[key] = {};
    }
    node = node[key];
  }

  node[parts[parts.length - 1]!] = value;
}

function ensureSubdocumentIds(node: unknown) {
  if (Array.isArray(node)) {
    for (const item of node) ensureSubdocumentIds(item);
    return;
  }

  if (!node || typeof node !== "object") return;

  const obj = node as PlainObject;
  for (const [, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        if (entry && typeof entry === "object") {
          const row = entry as PlainObject;
          if (!row._id) row._id = randomUUID();
        }
        ensureSubdocumentIds(entry);
      }
      continue;
    }
    ensureSubdocumentIds(value);
  }
}

function stripRuntime(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stripRuntime(item));
  }

  if (!value || typeof value !== "object") return value;

  const input = value as PlainObject;
  const output: PlainObject = {};
  for (const [key, entry] of Object.entries(input)) {
    if (key === "_id" || key === "createdAt" || key === "updatedAt") continue;
    if (typeof entry === "function") continue;
    output[key] = stripRuntime(entry);
  }
  return output;
}

function matchesOperator(pathValues: unknown[], operator: string, expected: any): boolean {
  if (operator === "$in") {
    const expectedValues = Array.isArray(expected) ? expected : [];
    return pathValues.some((value) => expectedValues.some((row) => valuesEqual(value, row)));
  }

  if (operator === "$nin") {
    const expectedValues = Array.isArray(expected) ? expected : [];
    return pathValues.every((value) => expectedValues.every((row) => !valuesEqual(value, row)));
  }

  if (operator === "$gte") {
    return pathValues.some((value) => Number(normalizeScalar(value) ?? Number.NaN) >= Number(normalizeScalar(expected)));
  }

  if (operator === "$gt") {
    return pathValues.some((value) => Number(normalizeScalar(value) ?? Number.NaN) > Number(normalizeScalar(expected)));
  }

  if (operator === "$lte") {
    return pathValues.some((value) => Number(normalizeScalar(value) ?? Number.NaN) <= Number(normalizeScalar(expected)));
  }

  if (operator === "$lt") {
    return pathValues.some((value) => Number(normalizeScalar(value) ?? Number.NaN) < Number(normalizeScalar(expected)));
  }

  if (operator === "$regex") {
    const pattern =
      expected instanceof RegExp
        ? expected.source
        : typeof expected === "object" && expected && "$regex" in (expected as PlainObject)
          ? String((expected as PlainObject).$regex || "")
          : String(expected || "");
    const flags =
      typeof expected === "object" && expected && "$options" in (expected as PlainObject)
        ? String((expected as PlainObject).$options || "")
        : "";
    const regex = new RegExp(pattern, flags);
    return pathValues.some((value) => regex.test(String(value || "")));
  }

  if (operator === "$elemMatch") {
    return pathValues.some((value) => {
      if (!Array.isArray(value)) return false;
      return value.some((entry) => {
        if (entry && typeof entry === "object") {
          return matchesQuery(entry as PlainObject, (expected || {}) as PlainObject);
        }
        return matchesCondition([entry], expected);
      });
    });
  }

  if (operator === "$exists") {
    const shouldExist = Boolean(expected);
    const exists = pathValues.some((value) => value !== undefined && value !== null);
    return shouldExist ? exists : !exists;
  }

  return false;
}

function matchesCondition(pathValues: unknown[], condition: unknown): boolean {
  if (condition && typeof condition === "object" && !Array.isArray(condition) && !(condition instanceof Date)) {
    const keys = Object.keys(condition as PlainObject);
    const hasOperator = keys.some((key) => key.startsWith("$"));
    if (hasOperator) {
      const operatorObject = condition as PlainObject;
      return keys.every((operator) => {
        if (operator === "$options") return true;
        if (operator === "$regex") {
          return matchesOperator(pathValues, operator, {
            $regex: operatorObject.$regex,
            $options: operatorObject.$options,
          });
        }
        return matchesOperator(pathValues, operator, operatorObject[operator]);
      });
    }
  }

  return pathValues.some((value) => valuesEqual(value, condition));
}

export function matchesQuery(document: PlainObject, query: PlainObject): boolean {
  for (const [key, condition] of Object.entries(query || {})) {
    if (key === "$or") {
      const rows = Array.isArray(condition) ? condition : [];
      if (!rows.some((entry) => matchesQuery(document, entry as PlainObject))) return false;
      continue;
    }

    if (key === "$and") {
      const rows = Array.isArray(condition) ? condition : [];
      if (!rows.every((entry) => matchesQuery(document, entry as PlainObject))) return false;
      continue;
    }

    const pathValues = key === "_id" ? [document._id] : readPathValues(document, key);
    if (!matchesCondition(pathValues, condition)) return false;
  }

  return true;
}

function compareDocs(left: PlainObject, right: PlainObject, sort: SortSpec) {
  for (const [path, direction] of Object.entries(sort)) {
    const a = normalizeScalar(readPathValue(left, path));
    const b = normalizeScalar(readPathValue(right, path));
    if (a === b) continue;
    if (a === undefined || a === null) return direction === 1 ? -1 : 1;
    if (b === undefined || b === null) return direction === 1 ? 1 : -1;
    if (a < b) return direction === 1 ? -1 : 1;
    if (a > b) return direction === 1 ? 1 : -1;
  }
  return 0;
}

function normalizeSort(input: SortSpec | string | undefined): SortSpec {
  if (!input) return {};
  if (typeof input !== "string") return input;

  const spec: SortSpec = {};
  const parts = input
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  for (const part of parts) {
    if (part.startsWith("-")) {
      spec[part.slice(1)] = -1;
    } else if (part.startsWith("+")) {
      spec[part.slice(1)] = 1;
    } else {
      spec[part] = 1;
    }
  }

  return spec;
}

function pickProjection(document: PlainObject, projection?: ProjectionSpec, selectPaths?: string[]) {
  if (!projection && (!selectPaths || !selectPaths.length)) return cloneValue(document);

  const include = new Set<string>(["_id"]);
  if (projection) {
    for (const [key, value] of Object.entries(projection)) {
      if (value) include.add(key);
    }
  }
  for (const key of selectPaths || []) include.add(key);

  const output: PlainObject = {};
  for (const key of include) {
    if (key === "_id") {
      output._id = document._id;
      continue;
    }
    const value = readPathValue(document, key);
    writePathValue(output, key, value);
  }
  return output;
}

function applyUpdate(target: PlainObject, update: UpdateSpec | PlainObject, isUpsertInsert = false) {
  const updateObject = update as PlainObject;
  const hasOperator = Object.keys(updateObject).some((key) => key.startsWith("$"));

  if (!hasOperator) {
    for (const [key, value] of Object.entries(updateObject)) {
      target[key] = cloneValue(value);
    }
    return;
  }

  if (updateObject.$set && typeof updateObject.$set === "object") {
    for (const [key, value] of Object.entries(updateObject.$set as PlainObject)) {
      writePathValue(target, key, cloneValue(value));
    }
  }

  if (isUpsertInsert && updateObject.$setOnInsert && typeof updateObject.$setOnInsert === "object") {
    for (const [key, value] of Object.entries(updateObject.$setOnInsert as PlainObject)) {
      writePathValue(target, key, cloneValue(value));
    }
  }

  if (updateObject.$inc && typeof updateObject.$inc === "object") {
    for (const [key, value] of Object.entries(updateObject.$inc as PlainObject)) {
      const current = Number(readPathValue(target, key) || 0);
      writePathValue(target, key, current + Number(value || 0));
    }
  }

  if (updateObject.$push && typeof updateObject.$push === "object") {
    for (const [key, value] of Object.entries(updateObject.$push as PlainObject)) {
      const current = toArray(readPathValue(target, key) as unknown[] | unknown).filter((entry) => entry !== undefined);
      current.push(cloneValue(value));
      writePathValue(target, key, current);
    }
  }
}

async function listCollectionRows(collection: string) {
  return prisma.document.findMany({
    where: { collection },
    orderBy: { createdAt: "asc" },
  });
}

type DocumentModel = ReturnType<typeof createDocumentModel>;

function hydrateDocument(model: DocumentModel, row: { id: string; data: Prisma.JsonValue; createdAt: Date; updatedAt: Date }) {
  const payload = (cloneValue(row.data) || {}) as PlainObject;
  const doc: PlainObject = {
    ...payload,
    _id: row.id,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };

  const attachArrayHelpers = (node: unknown, owner: unknown, ownerKey?: string, ownerArray?: unknown[]) => {
    if (!node || typeof node !== "object") return;

    if (Array.isArray(node)) {
      for (const entry of node) {
        attachArrayHelpers(entry, node, undefined, node);
      }
      return;
    }

    const obj = node as PlainObject;
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        for (const entry of value) {
          if (entry && typeof entry === "object") {
            const rowValue = entry as PlainObject;
            if (!rowValue._id) rowValue._id = randomUUID();
            Object.defineProperty(rowValue, "deleteOne", {
              enumerable: false,
              configurable: true,
              value: () => {
                const index = value.indexOf(entry);
                if (index >= 0) value.splice(index, 1);
              },
            });
          }
          attachArrayHelpers(entry, value, undefined, value);
        }
        continue;
      }
      attachArrayHelpers(value, obj, key, ownerArray);
    }

    Object.defineProperty(obj, "save", {
      enumerable: false,
      configurable: true,
      value: async () => {
        await model._saveById(String(doc._id), doc);
        const refreshed = await model.findById(String(doc._id));
        if (refreshed) {
          for (const key of Object.keys(doc)) delete doc[key];
          Object.assign(doc, refreshed);
        }
        return doc;
      },
    });

    Object.defineProperty(obj, "deleteOne", {
      enumerable: false,
      configurable: true,
      value: async () => {
        if (ownerArray && ownerArray.includes(node)) {
          const index = ownerArray.indexOf(node);
          if (index >= 0) ownerArray.splice(index, 1);
          return;
        }

        if (owner && typeof owner === "object" && ownerKey) {
          delete (owner as PlainObject)[ownerKey];
          return;
        }

        await model.deleteOne({ _id: String(doc._id) });
      },
    });
  };

  ensureSubdocumentIds(doc);
  attachArrayHelpers(doc, null);
  return doc;
}

class QueryMany {
  private sortSpec: SortSpec = {};
  private skipValue = 0;
  private limitValue = Number.POSITIVE_INFINITY;
  private projection?: ProjectionSpec;
  private selectPaths: string[] = [];

  constructor(
    private readonly model: DocumentModel,
    private readonly filter: PlainObject,
    projection?: ProjectionSpec,
  ) {
    this.projection = projection;
  }

  sort(spec: SortSpec | string) {
    this.sortSpec = normalizeSort(spec);
    return this;
  }

  skip(value: number) {
    this.skipValue = Math.max(0, Math.floor(Number(value || 0)));
    return this;
  }

  limit(value: number) {
    this.limitValue = Math.max(0, Math.floor(Number(value || 0)));
    return this;
  }

  select(fields: string) {
    this.selectPaths = String(fields || "")
      .split(/\s+/)
      .map((item) => item.trim())
      .filter(Boolean);
    return this;
  }

  populate(_field: string, _selection?: string) {
    return this;
  }

  lean() {
    return this;
  }

  cursor() {
    const load = this.exec();
    async function* iterator() {
      const rows = await load;
      for (const row of rows) yield row;
    }
    return iterator();
  }

  async exec() {
    const rows = await this.model._queryMany(this.filter);
    const sorted = rows.sort((left, right) => compareDocs(left, right, this.sortSpec));
    const sliced = sorted.slice(this.skipValue, this.skipValue + this.limitValue);

    const shouldProject = Boolean(
      (this.projection && Object.keys(this.projection).length) || this.selectPaths.length,
    );
    if (!shouldProject) return sliced;

    return sliced.map((row) => pickProjection(row, this.projection, this.selectPaths));
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.exec().then(onfulfilled as any, onrejected as any);
  }
}

class QueryOne {
  private sortSpec: SortSpec = {};
  private selectPaths: string[] = [];
  private projection?: ProjectionSpec;

  constructor(
    private readonly model: DocumentModel,
    private readonly filter: PlainObject,
    projection?: ProjectionSpec,
  ) {
    this.projection = projection;
  }

  sort(spec: SortSpec | string) {
    this.sortSpec = normalizeSort(spec);
    return this;
  }

  select(fields: string) {
    this.selectPaths = String(fields || "")
      .split(/\s+/)
      .map((item) => item.trim())
      .filter(Boolean);
    return this;
  }

  populate(_field: string, _selection?: string) {
    return this;
  }

  lean() {
    return this;
  }

  async exec() {
    const rows = await this.model._queryMany(this.filter);
    const sorted = rows.sort((left, right) => compareDocs(left, right, this.sortSpec));
    const first = sorted[0] || null;
    if (!first) return null;

    const shouldProject = Boolean(
      (this.projection && Object.keys(this.projection).length) || this.selectPaths.length,
    );
    if (!shouldProject) return first;

    return pickProjection(first, this.projection, this.selectPaths);
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any | null) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.exec().then(onfulfilled as any, onrejected as any);
  }
}

export function createDocumentModel(collection: string) {
  const model = {
    collection,

    async _queryMany(filter: PlainObject) {
      const rows = await listCollectionRows(collection);
      return rows
        .map((row) => hydrateDocument(model, row as any))
        .filter((row) => matchesQuery(row, filter || {}));
    },

    async _saveById(id: string, document: PlainObject) {
      const rawPayload = stripRuntime(document);
      const payload =
        rawPayload === null
          ? Prisma.JsonNull
          : (rawPayload as Prisma.InputJsonValue);
      ensureSubdocumentIds(payload);

      await prisma.document.update({
        where: { id },
        data: { data: payload },
      });
    },

    find(filter: PlainObject = {}, projection?: ProjectionSpec) {
      return new QueryMany(model, filter || {}, projection);
    },

    findOne(filter: PlainObject = {}, projection?: ProjectionSpec) {
      return new QueryOne(model, filter || {}, projection);
    },

    findById(id: unknown, projection?: ProjectionSpec) {
      return new QueryOne(model, { _id: String(id || "") }, projection);
    },

    async create(data: PlainObject) {
      const payload = cloneValue(data || {}) as PlainObject;
      ensureSubdocumentIds(payload);
      const rawPayload = stripRuntime(payload);
      const safePayload =
        rawPayload === null
          ? Prisma.JsonNull
          : (rawPayload as Prisma.InputJsonValue);
      const created = await prisma.document.create({
        data: {
          collection,
          data: safePayload,
        },
      });

      return hydrateDocument(model, created as any);
    },

    async countDocuments(filter: PlainObject = {}) {
      const rows = await model._queryMany(filter || {});
      return rows.length;
    },

    async exists(filter: PlainObject = {}) {
      const row = await model.findOne(filter);
      if (!row) return null;
      return { _id: row._id };
    },

    async updateOne(filter: PlainObject, update: UpdateSpec | PlainObject) {
      const row = await model.findOne(filter);
      if (!row) return { matchedCount: 0, modifiedCount: 0 };
      applyUpdate(row, update as any, false);
      await model._saveById(String(row._id), row);
      return { matchedCount: 1, modifiedCount: 1 };
    },

    async updateMany(filter: PlainObject, update: UpdateSpec | PlainObject) {
      const rows = await model._queryMany(filter || {});
      for (const row of rows) {
        applyUpdate(row, update as any, false);
        await model._saveById(String(row._id), row);
      }
      return { matchedCount: rows.length, modifiedCount: rows.length };
    },

    async findOneAndUpdate(
      filter: PlainObject,
      update: UpdateSpec | PlainObject,
      options: FindOneAndUpdateOptions = {},
    ) {
      const existing = await model.findOne(filter);
      if (!existing && !options.upsert) return null;

      const original = existing ? cloneValue(existing) : null;
      let target = existing as PlainObject | null;

      if (!target) {
        target = {};
        for (const [key, value] of Object.entries(filter || {})) {
          if (!key.startsWith("$")) writePathValue(target, key, cloneValue(value));
        }
        applyUpdate(target, update as any, true);
        return model.create(target);
      }

      applyUpdate(target, update as any, false);
      await model._saveById(String(target._id), target);
      if (options.new === false) return original;
      return target;
    },

    async findByIdAndUpdate(id: string, update: UpdateSpec | PlainObject) {
      return model.findOneAndUpdate({ _id: String(id || "") }, update);
    },

    async findOneAndDelete(filter: PlainObject) {
      const row = await model.findOne(filter);
      if (!row) return null;
      await prisma.document.delete({ where: { id: String(row._id) } });
      return row;
    },

    async findByIdAndDelete(id: string) {
      return model.findOneAndDelete({ _id: String(id || "") });
    },

    async deleteOne(filter: PlainObject) {
      const row = await model.findOne(filter);
      if (!row) return { deletedCount: 0 };
      await prisma.document.delete({ where: { id: String(row._id) } });
      return { deletedCount: 1 };
    },

    async deleteMany(filter: PlainObject) {
      const rows = await model._queryMany(filter || {});
      for (const row of rows) {
        await prisma.document.delete({ where: { id: String(row._id) } });
      }
      return { deletedCount: rows.length };
    },

    async aggregate(pipeline: PlainObject[]) {
      let rows = await model._queryMany({});

      for (const stage of pipeline || []) {
        if (stage.$match) {
          rows = rows.filter((row) => matchesQuery(row, stage.$match));
          continue;
        }

        if (stage.$group) {
          const spec = stage.$group as AggregateGroupSpec;
          const groups = new Map<string, PlainObject>();

          const buildGroupKey = (doc: PlainObject) => {
            const idSpec = spec._id;
            if (idSpec === null || idSpec === undefined) return { key: "__null__", value: null };
            if (typeof idSpec === "string" && idSpec.startsWith("$")) {
              const value = readPathValue(doc, idSpec.slice(1));
              return { key: String(normalizeScalar(value) ?? "null"), value };
            }

            if (idSpec && typeof idSpec === "object") {
              const computed: PlainObject = {};
              for (const [key, value] of Object.entries(idSpec)) {
                if (value && typeof value === "object" && "$year" in (value as PlainObject)) {
                  const path = String((value as PlainObject).$year || "").replace(/^\$/, "");
                  const date = new Date(readPathValue(doc, path) as any);
                  computed[key] = Number.isNaN(date.getTime()) ? null : date.getUTCFullYear();
                  continue;
                }
                if (value && typeof value === "object" && "$month" in (value as PlainObject)) {
                  const path = String((value as PlainObject).$month || "").replace(/^\$/, "");
                  const date = new Date(readPathValue(doc, path) as any);
                  computed[key] = Number.isNaN(date.getTime()) ? null : date.getUTCMonth() + 1;
                  continue;
                }
                if (value && typeof value === "object" && "$dayOfMonth" in (value as PlainObject)) {
                  const path = String((value as PlainObject).$dayOfMonth || "").replace(/^\$/, "");
                  const date = new Date(readPathValue(doc, path) as any);
                  computed[key] = Number.isNaN(date.getTime()) ? null : date.getUTCDate();
                  continue;
                }
              }
              return { key: JSON.stringify(computed), value: computed };
            }

            return { key: String(idSpec), value: idSpec };
          };

          for (const doc of rows) {
            const groupKey = buildGroupKey(doc);
            if (!groups.has(groupKey.key)) {
              groups.set(groupKey.key, { _id: groupKey.value });
            }

            const current = groups.get(groupKey.key)!;
            for (const [field, accumulator] of Object.entries(spec)) {
              if (field === "_id") continue;
              if (!accumulator || typeof accumulator !== "object") continue;
              const acc = accumulator as PlainObject;

              if ("$sum" in acc) {
                const source = acc.$sum;
                const increment =
                  typeof source === "number"
                    ? source
                    : Number(readPathValue(doc, String(source || "").replace(/^\$/, "")) || 0);
                current[field] = Number(current[field] || 0) + increment;
                continue;
              }

              if ("$avg" in acc) {
                const path = String(acc.$avg || "").replace(/^\$/, "");
                const keyCount = `__${field}_count`;
                const keySum = `__${field}_sum`;
                const value = Number(readPathValue(doc, path) || 0);
                current[keyCount] = Number(current[keyCount] || 0) + 1;
                current[keySum] = Number(current[keySum] || 0) + value;
                current[field] = current[keySum] / current[keyCount];
                continue;
              }

              if ("$max" in acc) {
                const path = String(acc.$max || "").replace(/^\$/, "");
                const value = readPathValue(doc, path);
                if (current[field] === undefined || normalizeScalar(value)! > normalizeScalar(current[field])!) {
                  current[field] = value;
                }
                continue;
              }
            }
          }

          rows = Array.from(groups.values());
          rows = rows.map((row) => {
            for (const key of Object.keys(row)) {
              if (key.startsWith("__")) delete row[key];
            }
            return row;
          });
          continue;
        }

        if (stage.$sort) {
          rows = rows.sort((left, right) => compareDocs(left, right, stage.$sort as SortSpec));
          continue;
        }

        if (stage.$limit) {
          rows = rows.slice(0, Number(stage.$limit || 0));
          continue;
        }
      }

      return rows;
    },
  };

  return model;
}

export const DocumentId = Types.ObjectId;
