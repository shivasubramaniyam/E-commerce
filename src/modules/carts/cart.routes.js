import { Router } from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
} from "./cart.controller.js";

import { authenticate } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  addToCartSchema,
  updateCartItemSchema,
} from "../../validators/cart.schema.js";

const router = Router();

router.use(authenticate); // ALL cart routes require login

router.get("/", getCart);
router.post("/add", validate(addToCartSchema), addToCart);
router.put("/item/:itemId", validate(updateCartItemSchema), updateCartItem);
router.delete("/item/:itemId", removeCartItem);

export default router;
