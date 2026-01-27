import { Router } from "express";
import authRoutes from "./modules/auth/auth.routes.js";
import { authenticate } from "./middleware/auth.middleware.js";
import productRoutes from "./modules/products/product.routes.js";
import cartRoutes from "./modules/carts/cart.routes.js";
import orderRoutes from "./modules/order/order.routes.js";
const router = Router();

// base API route

router.get("/", (req, res) => {
  res.json({
    message: "E-Commerce API V1",
    status: "OK",
  });
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
