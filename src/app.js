import express from "express";
import routes from "./routes.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

// Middleware
app.use(express.json());

// API routes
app.use("/api", routes);

// landing page

// Health Check
app.get("/health", (req, res) => {
  res.json({ status: "API is running" });
});
app.use(errorHandler);

export default app;
