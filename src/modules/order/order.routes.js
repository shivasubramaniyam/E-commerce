import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";

import { checkOutOrder, getMyOrder, getOrderById } from "./order.controller.js";

const router = Router();

router.use(authenticate);
router.post("/checkout", checkOutOrder);
router.get("/", getMyOrder);
router.get("/:id", getOrderById);

export default router;
