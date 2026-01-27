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
import { validate } from "../../middleware/validate.middleware.js";
import {
  createProductSchema,
  updateProductSChema,
} from "../../validators/product.schema.js";

const router = Router();

// PUBLIC
router.get("/", getAllProducts);
router.get("/:id", getProductById);

// ADMIN
router.post(
  "/",
  authenticate,
  authorizeRole("ADMIN"),
  validate(createProductSchema),
  createProduct,
);
router.put(
  "/:id",
  authenticate,
  authorizeRole("ADMIN"),
  validate(updateProductSChema),
  updateProduct,
);
router.delete("/:id", authenticate, authorizeRole("ADMIN"), deleteProduct);

export default router;
