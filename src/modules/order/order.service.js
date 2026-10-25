// import items from "razorpay/dist/types/items";
import prisma from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";

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
    throw new AppError("Cart is Empty", 400);
  }

  const order = await prisma.$transaction(async (tx) => {
    let totalAmount = 0;

    // Validate stock & calculate total
    for (const item of cart.items) {
      if (!item.product.isActive) {
        throw new AppError(`${item.product.name} is unavailable`, 400);
      }

      if (item.product.stock < item.quantity) {
        throw new AppError(`Insufficient stock for ${item.product.name}`, 400);
      }

      totalAmount += item.price * item.quantity;
    }

    // Create order
    const order = await tx.order.create({
      data: {
        userId,
        totalAmount,
        paymentStatus: "COD",
      },
    });

    // ✅ PERF: batch insert all order items in a single query (was N individual inserts)
    await tx.orderItem.createMany({
      data: cart.items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
    });

    // ✅ PERF: batch stock updates in parallel (was N sequential awaits)
    await Promise.all(
      cart.items.map((item) =>
        tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        })
      )
    );

    // Close cart
    await tx.cart.update({
      where: { id: cart.id },
      data: { status: "CHECKED_OUT" },
    });

    // Fetch full order WITH items
    return tx.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: { product: true },
        },
      },
    });
  });

  return order;
}

export async function getMyOrdersService(userId, query) {
  const { page = 1, limit = 5, status } = query;

  const skip = (page - 1) * limit;

  const where = { userId };
  if (status) {
    where.status = status;
  }

  // ✅ PERF: run count + findMany in a single transaction for consistency
  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      include: { items: true },
      skip,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    data: orders, // ✅ Fixed: was `data: orders` but variable was named `order`
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
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

export async function updateOrderStatusService(orderId, status) {
  return prisma.order.update({
    where: { id: orderId },
    data: { status },
  });
}
