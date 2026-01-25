import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";

import {
  checkOutOrder,
  getMyOrder,
  getOrderById,
  updateOrderStatus,
} from "./order.controller.js";
import { authorizeRole } from "../../middleware/role.middleware.js";

const router = Router();

router.use(authenticate);
router.post("/checkout", checkOutOrder);
router.get("/", getMyOrder);
router.get("/:id", getOrderById);

// admin to change the order status
router.put("/:id/status", authorizeRole("ADMIN"), updateOrderStatus);

export default router;
