import { app } from "../app";
import { collectRouteInventory } from "./routeInventory";

const routes = collectRouteInventory(app);

for (const route of routes) {
  const middlewares = route.middlewares.length ? route.middlewares.join(", ") : "-";
  console.log(`${route.method.padEnd(6)} ${route.path} :: ${middlewares}`);
}
