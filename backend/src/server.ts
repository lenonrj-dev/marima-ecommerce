import { app } from "./app";
import { connectDb } from "./config/db";
import { env } from "./config/env";

async function bootstrap() {
  await connectDb();

  app.listen(env.PORT, () => {
    console.log(`API online em http://localhost:${env.PORT}/api/v1`);
  });
}

bootstrap().catch((error) => {
  console.error("Erro ao iniciar backend:", error);
  process.exit(1);
});
