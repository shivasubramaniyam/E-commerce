import prisma from "../../config/db.js";

export async function checkoutOrderService(userId) {
  // Get active cart
  const cart = await prisma.cart.findFirst({
    where: { userId, status: "ACTIVE" },
    include: {
      items: {
        include: { product: true },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is Empty");
  }
  // Partial orders
  // Overselling stock

  const order = await prisma.$transaction(async (tx) => {
    let totalAmount = 0;

    //   Validate stock and calculate total

    for (const item of cart.items) {
      if (!item.product.isActive) {
        throw new Error(`${item.product.name} is unavailable`);
      }

      if (item.product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${item.product.name}`);
      }

      totalAmount += item.product.price * item.quantity;
    }

    //   Create Order
    const order = await tx.order.create({
      data: {
        userId,
        totalAmount,
        paymentStatus: "COD",
      },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    //  Move cart items → order items
    for (const item of cart.items) {
      await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.price,
        },
      });
    }

    //   Reduce stock
    for (const item of cart.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity },
        },
      });
    }
    //   Close cart

    await tx.cart.update({
      where: { id: cart.id },
      data: { status: "CHECKED_OUT" },
    });
    return order;
  });

  return order;
}

export async function getMyOrdersService(userId) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrderByIdService(userId, orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order || order.userId !== userId) {
    throw new Error("Order not found");
  }
  return order;
}
