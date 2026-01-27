// import Razorpay from "razorpay";
// import prisma from "../../config/db.js";

// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// export async function createRazorpayOrder(userId) {
//   // Get active cart
//   const cart = await prisma.cart.findFirst({
//     where: { userId, status: "ACTIVE" },
//     include: {
//       items: { include: { product: true } },
//     },
//   });

//   if (!cart || cart.items.length === 0) {
//     throw new Error("Cart is empty");
//   }

//   // Secure total calculation
//   let totalAmount = 0;

//   for (const item of cart.items) {
//     if (!item.product.isActive) {
//       throw new Error("Product unavailable");
//     }

//     if (item.product.stock < item.quantity) {
//       throw new Error("Insufficient stock");
//     }

//     totalAmount += item.price * item.quantity;
//   }

//   // Razorpay expects paise
//   const order = await razorpay.orders.create({
//     amount: totalAmount * 100,
//     currency: "INR",
//     receipt: `receipt_${cart.id}`,
//     notes: {
//       userId,
//       cartId: cart.id,
//     },
//   });

//   // Create pending order in DB
//   await prisma.order.create({
//     data: {
//       userId,
//       totalAmount,
//       paymentStatus: "PENDING",
//       paymentIntentId: order.id, // reuse field
//     },
//   });

//   return {
//     orderId: order.id,
//     amount: order.amount,
//     currency: order.currency,
//     key: process.env.RAZORPAY_KEY_ID,
//   };
// }
