import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";

import {
  checkOutOrder,
  getMyOrder,
  getOrderById,
  updateOrderStatus,
} from "./order.controller.js";
import { authorizeRole } from "../../middleware/role.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { updateOrderStatusService } from "./order.service.js";
import { updateOrderStatusSchema } from "../../validators/order.schema.js";

const router = Router();

router.use(authenticate);
router.post("/checkout", checkOutOrder);
router.get("/", getMyOrder);
router.get("/:id", getOrderById);

// admin to change the order status
router.put(
  "/:id/status",
  authorizeRole("ADMIN"),
  validate(updateOrderStatusSchema),
  updateOrderStatus,
);

export default router;
