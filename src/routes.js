import { Router } from "express";
import authRoutes from "./modules/auth/auth.routes.js";
import { authenticate } from "./middleware/auth.middleware.js";
import productRoutes from "./modules/products/product.routes.js";
import cartRoutes from "./modules/carts/cart.routes.js";
import orderRoutes from "./modules/order/order.routes.js";
import { readFileSync } from "node:fs";
import { dirname, join } from "path";
import { fileURLToPath } from "node:url";
const router = Router();
const __dirname = dirname(fileURLToPath(import.meta.url));

// ✅ PERF: read once at startup, serve from memory — was doing a sync disk read on every request
const docsHtml = readFileSync(join(__dirname, "../public/index.html"), "utf-8");

// base API route — serves the HTML docs page
router.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(docsHtml);
});

router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.get("/protected", authenticate, (req, res) => {
  res.json({
    message: "you accessed a protected route",
    user: req.user,
  });
});

export default router;
