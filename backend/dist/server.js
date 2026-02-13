"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const db_1 = require("./config/db");
const env_1 = require("./config/env");
const MAX_PORT_ATTEMPTS = 10;
function isObject(value) {
    return typeof value === "object" && value !== null;
}
function isEaddrInUse(error) {
    if (!isObject(error))
        return false;
    return "code" in error && String(error.code) === "EADDRINUSE";
}
function listenOnPort(port) {
    return new Promise((resolve, reject) => {
        const server = app_1.app.listen(port);
        function onListening() {
            server.off("error", onError);
            resolve(server);
        }
        function onError(err) {
            server.off("listening", onListening);
            reject(err);
        }
        server.once("listening", onListening);
        server.once("error", onError);
    });
}
async function startServer() {
    await (0, db_1.connectDb)();
    const basePort = Number(env_1.env.PORT || 4000);
    let server = null;
    let selectedPort = basePort;
    let lastError;
    for (let attempt = 0; attempt < MAX_PORT_ATTEMPTS; attempt += 1) {
        const port = basePort + attempt;
        selectedPort = port;
        try {
            server = await listenOnPort(port);
            break;
        }
        catch (error) {
            lastError = error;
            if (isEaddrInUse(error)) {
                const nextPort = port + 1;
                if (attempt < MAX_PORT_ATTEMPTS - 1) {
                    console.log(`Porta em uso, tentando ${nextPort}...`);
                    continue;
                }
            }
            throw error;
        }
    }
    if (!server) {
        throw lastError || new Error("Não foi possível iniciar o servidor.");
    }
    process.env.RUNTIME_PORT = String(selectedPort);
    const baseUrl = env_1.isProd ? "https://sua-api" : `http://localhost:${selectedPort}`;
    console.log(`API online em ${baseUrl}/api/v1`);
    console.log(`Inicie ngrok: ngrok http ${selectedPort}`);
    let shuttingDown = false;
    async function shutdown(signal) {
        if (shuttingDown)
            return;
        shuttingDown = true;
        console.log(`Recebido ${signal}. Encerrando servidor...`);
        const timeout = setTimeout(() => {
            console.log("Shutdown forçado após timeout.");
            process.exit(1);
        }, 10_000);
        timeout.unref();
        await new Promise((resolve) => {
            server?.close(() => resolve());
        });
        await (0, db_1.disconnectDb)();
        process.exit(0);
    }
    process.once("SIGINT", () => void shutdown("SIGINT"));
    process.once("SIGTERM", () => void shutdown("SIGTERM"));
}
startServer().catch((error) => {
    console.error("Erro ao iniciar backend:", error);
    process.exit(1);
});
