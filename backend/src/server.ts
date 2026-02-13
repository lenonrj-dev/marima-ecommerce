import type { Server } from "http";
import { app } from "./app";
import { connectDb, disconnectDb } from "./config/db";
import { env, isProd } from "./config/env";
import { buildStoreRedirectUrls, normalizeBaseUrl, requireHttpsInProd } from "./utils/url";
import { startMercadoPagoPendingExpiryJob } from "./jobs/mercadopagoPendingExpiry";

const MAX_PORT_ATTEMPTS = 10;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isEaddrInUse(error: unknown) {
  if (!isObject(error)) return false;
  return "code" in error && String(error.code) === "EADDRINUSE";
}

function listenOnPort(port: number): Promise<Server> {
  return new Promise((resolve, reject) => {
    const server = app.listen(port);

    function onListening() {
      server.off("error", onError);
      resolve(server);
    }

    function onError(err: unknown) {
      server.off("listening", onListening);
      reject(err);
    }

    server.once("listening", onListening);
    server.once("error", onError);
  });
}

async function startServer() {
  await connectDb();

  const basePort = Number(env.PORT || 4000);
  let server: Server | null = null;
  let selectedPort = basePort;
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_PORT_ATTEMPTS; attempt += 1) {
    const port = basePort + attempt;
    selectedPort = port;

    try {
      server = await listenOnPort(port);
      break;
    } catch (error) {
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
  const publicApiUrl = env.API_PUBLIC_URL ? normalizeBaseUrl(env.API_PUBLIC_URL, "API_PUBLIC_URL") : null;
  if (publicApiUrl) requireHttpsInProd(publicApiUrl, "API_PUBLIC_URL");

  if (publicApiUrl) {
    console.log(`API online em ${publicApiUrl}/api/v1`);
  } else if (!isProd) {
    console.log(`API online em http://localhost:${selectedPort}/api/v1`);
    console.log(`Inicie ngrok: ngrok http ${selectedPort}`);
  } else {
    console.log("API online.");
  }

  console.log(`[URLS] NODE_ENV=${env.NODE_ENV}`);
  if (env.STORE_URL) {
    try {
      const urls = buildStoreRedirectUrls(env.STORE_URL);
      console.log(`[URLS] STORE_URL=${urls.base}`);
      console.log(`[URLS] MP back_urls: success=${urls.success} failure=${urls.failure} pending=${urls.pending}`);
    } catch (error) {
      const err: any = error;
      let storeUrlValue = String(env.STORE_URL);
      try {
        storeUrlValue = normalizeBaseUrl(env.STORE_URL, "STORE_URL");
      } catch {
        // Mantém o valor bruto se a URL estiver inválida.
      }
      console.log(`[URLS] STORE_URL=${storeUrlValue}`);
      console.log(`[URLS] MP back_urls: erro ao gerar (${err?.code ?? "erro"}): ${err?.message ?? String(err)}`);
    }
  } else {
    console.log("[URLS] STORE_URL=(não configurada)");
  }

  startMercadoPagoPendingExpiryJob();

  let shuttingDown = false;

  async function shutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`Recebido ${signal}. Encerrando servidor...`);

    const timeout = setTimeout(() => {
      console.log("Shutdown forçado após timeout.");
      process.exit(1);
    }, 10_000);
    timeout.unref();

    await new Promise<void>((resolve) => {
      server?.close(() => resolve());
    });

    await disconnectDb();
    process.exit(0);
  }

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
}

startServer().catch((error) => {
  console.error("Erro ao iniciar backend:", error);
  process.exit(1);
});
