"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const db_1 = require("./config/db");
const env_1 = require("./config/env");
const url_1 = require("./utils/url");
const mercadopagoPendingExpiry_1 = require("./jobs/mercadopagoPendingExpiry");
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
    const publicApiUrl = env_1.env.API_PUBLIC_URL ? (0, url_1.normalizeBaseUrl)(env_1.env.API_PUBLIC_URL, "API_PUBLIC_URL") : null;
    if (publicApiUrl)
        (0, url_1.requireHttpsInProd)(publicApiUrl, "API_PUBLIC_URL");
    if (publicApiUrl) {
        console.log(`API online em ${publicApiUrl}/api/v1`);
    }
    else if (!env_1.isProd) {
        console.log(`API online em http://localhost:${selectedPort}/api/v1`);
        console.log(`Inicie ngrok: ngrok http ${selectedPort}`);
    }
    else {
        console.log("API online.");
    }
    console.log(`[URLS] NODE_ENV=${env_1.env.NODE_ENV}`);
    if (env_1.env.STORE_URL) {
        try {
            const urls = (0, url_1.buildStoreRedirectUrls)(env_1.env.STORE_URL);
            console.log(`[URLS] STORE_URL=${urls.base}`);
            console.log(`[URLS] MP back_urls: success=${urls.success} failure=${urls.failure} pending=${urls.pending}`);
        }
        catch (error) {
            const err = error;
            let storeUrlValue = String(env_1.env.STORE_URL);
            try {
                storeUrlValue = (0, url_1.normalizeBaseUrl)(env_1.env.STORE_URL, "STORE_URL");
            }
            catch {
                // Mantém o valor bruto se a URL estiver inválida.
            }
            console.log(`[URLS] STORE_URL=${storeUrlValue}`);
            console.log(`[URLS] MP back_urls: erro ao gerar (${err?.code ?? "erro"}): ${err?.message ?? String(err)}`);
        }
    }
    else {
        console.log("[URLS] STORE_URL=(não configurada)");
    }
    (0, mercadopagoPendingExpiry_1.startMercadoPagoPendingExpiryJob)();
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
