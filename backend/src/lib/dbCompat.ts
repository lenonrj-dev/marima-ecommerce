import { randomUUID } from "crypto";

export type FilterQuery<T = any> = Record<string, unknown> & Partial<T>;

class ObjectIdCompat {
  private value: string;

  constructor(value?: string) {
    const normalized = String(value || "").trim();
    this.value = normalized || randomUUID().replace(/-/g, "");
  }

  toString() {
    return this.value;
  }

  valueOf() {
    return this.value;
  }

  static isValid(value: unknown) {
    return String(value || "").trim().length > 0;
  }
}

export const Types = {
  ObjectId: ObjectIdCompat,
};

