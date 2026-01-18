import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { createOrder } from "./checkout.controller.js";

const router = Router();

router.post("/", authenticate, createOrder);

export default router;
