"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("../app");
const routeInventory_1 = require("./routeInventory");
const routes = (0, routeInventory_1.collectRouteInventory)(app_1.app);
for (const route of routes) {
    const middlewares = route.middlewares.length ? route.middlewares.join(", ") : "-";
    console.log(`${route.method.padEnd(6)} ${route.path} :: ${middlewares}`);
}
