import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes";
import { corsOrigins, isProd } from "./config/env";
import { errorHandler } from "./middlewares/errorHandler";
import { notFound } from "./middlewares/notFound";

export const app = express();
app.set("trust proxy", 1);

const corsOriginsSet = new Set(corsOrigins.map((item) => item.replace(/\/$/, "")));

const corsConfig: cors.CorsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, false);

    const normalized = origin.replace(/\/$/, "");
    const allowed = corsOriginsSet.has(normalized);

    if (!isProd) {
      console.log(`[CORS] ${allowed ? "ALLOW" : "BLOCK"} origin=${normalized}`);
    }

    callback(null, allowed ? normalized : false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "ngrok-skip-browser-warning"],
  optionsSuccessStatus: 204,
};

app.use(helmet());
app.use(morgan("dev"));
app.use(cors(corsConfig));
app.options("*", cors(corsConfig));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/v1", routes);

app.use(notFound);
app.use(errorHandler);
