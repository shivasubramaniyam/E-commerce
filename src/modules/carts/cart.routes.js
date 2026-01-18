import { Router } from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
} from "./cart.controller.js";

import { authenticate } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate); // ALL cart routes require login

router.get("/", getCart);
router.post("/add", addToCart);
router.put("/item/:itemId", updateCartItem);
router.delete("/item/:itemId", removeCartItem);

export default router;
