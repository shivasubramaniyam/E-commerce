import { createRazorpayOrder } from "./razorpay.service.js";

export async function createOrder(req, res) {
  try {
    const order = await createRazorpayOrder(req.user.userId);
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
