import crypto from "crypto";
import prisma from "../config/db.js";

export async function razorpayWebhook(req, res) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  const signature = req.headers["x-razorpay-signature"];
  const body = JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  if (signature !== expectedSignature) {
    return res.status(400).json({ message: "Invalid webhook signature" });
  }

  const event = req.body;

  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity;
    const orderId = payment.order_id;

    // Mark order as PAID
    const order = await prisma.order.update({
      where: { paymentIntentId: orderId },
      data: { paymentStatus: "PAID" },
    });

    // Get cart
    const cart = await prisma.cart.findUnique({
      where: { id: payment.notes.cartId },
      include: { items: true },
    });

    // Reduce stock
    for (const item of cart.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // Close cart
    await prisma.cart.update({
      where: { id: cart.id },
      data: { status: "CHECKED_OUT" },
    });
  }

  res.json({ received: true });
}
