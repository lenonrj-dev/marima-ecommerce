import type { Application } from "express";

export type RouteInventoryItem = {
  method: string;
  path: string;
  middlewares: string[];
};

type ExpressLayer = {
  name?: string;
  route?: {
    path: string | string[];
    methods: Record<string, boolean>;
    stack?: Array<{ name?: string }>;
  };
  handle?: {
    stack?: ExpressLayer[];
  };
  regexp?: { source?: string; fast_slash?: boolean };
};

function normalizePath(path: string) {
  const normalized = path.replace(/\/+/g, "/");
  return normalized.endsWith("/") && normalized !== "/" ? normalized.slice(0, -1) : normalized;
}

function joinPath(prefix: string, child: string) {
  const base = prefix || "";
  const next = child || "";
  return normalizePath(`${base}/${next}`);
}

function regexPathToString(regexp: ExpressLayer["regexp"]) {
  if (!regexp || regexp.fast_slash) return "";
  const source = regexp.source || "";
  if (!source || source === "^\\/?$") return "";

  const decoded = source
    .replace(/\\\/\?\(\?=\\\/\|\$\)/g, "")
    .replace(/^\^/, "")
    .replace(/\$$/, "")
    .replace(/\\\//g, "/")
    .replace(/\(\?:\(\[\^\\\/]\+\?\)\)/g, ":param")
    .replace(/\(\[\^\\\/]\+\?\)/g, ":param")
    .replace(/\\\./g, ".");

  if (!decoded) return "";
  return decoded.startsWith("/") ? decoded : `/${decoded}`;
}

function extractRoutesFromStack(
  stack: ExpressLayer[],
  prefix: string,
  inheritedMiddlewares: string[] = [],
): RouteInventoryItem[] {
  const routes: RouteInventoryItem[] = [];
  const activeMiddlewares = [...inheritedMiddlewares];

  for (const layer of stack) {
    if (layer.route) {
      const routePaths = Array.isArray(layer.route.path) ? layer.route.path : [layer.route.path];
      const routeMiddlewares = (layer.route.stack || [])
        .map((row) => row.name || "anonymous")
        .filter((name) => name !== "anonymous");

      for (const routePath of routePaths) {
        for (const [method, enabled] of Object.entries(layer.route.methods)) {
          if (!enabled) continue;

          routes.push({
            method: method.toUpperCase(),
            path: joinPath(prefix, routePath),
            middlewares: Array.from(new Set([...activeMiddlewares, ...routeMiddlewares])),
          });
        }
      }

      continue;
    }

    if (layer.handle?.stack) {
      const nestedPrefix = regexPathToString(layer.regexp);
      routes.push(...extractRoutesFromStack(layer.handle.stack, joinPath(prefix, nestedPrefix), activeMiddlewares));
      continue;
    }

    const middlewareName = layer.name || "";
    if (middlewareName && middlewareName !== "anonymous") {
      activeMiddlewares.push(middlewareName);
    }
  }

  return routes;
}

export function collectRouteInventory(app: Application) {
  const rootStack = ((app as unknown as { _router?: { stack?: ExpressLayer[] } })._router?.stack || []) as ExpressLayer[];
  const allRoutes = extractRoutesFromStack(rootStack, "");

  return allRoutes
    .filter((item) => item.path.startsWith("/api/v1/") || item.path === "/health")
    .sort((a, b) => {
      const pathSort = a.path.localeCompare(b.path);
      if (pathSort !== 0) return pathSort;
      return a.method.localeCompare(b.method);
    });
}
