import prisma from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";

//  Get or create active cart
async function getOrCreateCart(userId) {
  let cart = await prisma.cart.findFirst({
    where: { userId, status: "ACTIVE" },
    include: { items: { include: { product: true } } },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: { items: true },
    });
  }

  return cart;
}

//  Get cart
export async function getCartService(userId) {
  return getOrCreateCart(userId);
}

//  Add to cart
export async function addToCartService(userId, productId, quantity = 1) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product || !product.isActive) {
    throw new AppError("Product not available", 404);
  }

  if (product.stock < quantity) {
    throw new AppError("Insufficient stock", 400);
  }

  const cart = await getOrCreateCart(userId);

  const existingItem = cart.items.find((item) => item.productId === productId);

  if (existingItem) {
    return prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + quantity },
    });
  }

  return prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId,
      quantity,
      price: product.price,
    },
  });
}

// 4️⃣ Update quantity
export async function updateCartItemService(userId, itemId, quantity) {
  if (quantity <= 0) {
    throw new AppError("Quantity must be greater than zero", 400);
  }

  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true },
  });

  if (!item || item.cart.userId !== userId) {
    throw new AppError("Cart item not found", 404);
  }

  return prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity },
  });
}

// 5️⃣ Remove item
export async function removeCartItemService(userId, itemId) {
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true },
  });

  if (!item || item.cart.userId !== userId) {
    throw new AppError("Cart item not found", 404);
  }

  await prisma.cartItem.delete({
    where: { id: itemId },
  });
}
