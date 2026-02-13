"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const db_1 = require("./config/db");
const env_1 = require("./config/env");
async function bootstrap() {
    await (0, db_1.connectDb)();
    app_1.app.listen(env_1.env.PORT, () => {
        console.log(`API online em http://localhost:${env_1.env.PORT}/api/v1`);
    });
}
bootstrap().catch((error) => {
    console.error("Erro ao iniciar backend:", error);
    process.exit(1);
});
