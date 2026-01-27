import express from "express";
import routes from "./routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import helmet from "helmet";
import { globalLimiter } from "./middleware/rateLimit.middleware.js";
import cors from "cors";

const allowedOrigins = [
  "http://localhost:3000",
  // add frontend URL
];

const app = express();

// allowed url to access to the backend
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    credentials: true,
  }),
);

// security hardening
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(globalLimiter);

// Middleware
app.use(express.json({ limit: "10kb" }));

// Trust proxy (important for deployment)
app.set("trust proxy", 1);

// API routes
app.use("/api", routes);

app.use(errorHandler);

export default app;
