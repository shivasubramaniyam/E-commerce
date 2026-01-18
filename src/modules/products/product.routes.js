import { Router } from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "./product.controller.js";

import { authenticate } from "../../middleware/auth.middleware.js";
import { authorizeRole } from "../../middleware/role.middleware.js";

const router = Router();

// PUBLIC
router.get("/", getAllProducts);
router.get("/:id", getProductById);

// ADMIN
router.post("/", authenticate, authorizeRole("ADMIN"), createProduct);
router.put("/:id", authenticate, authorizeRole("ADMIN"), updateProduct);
router.delete("/:id", authenticate, authorizeRole("ADMIN"), deleteProduct);

export default router;
