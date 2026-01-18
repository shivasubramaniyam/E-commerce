import prisma from "../../config/db.js";

// 1️⃣ Get or create active cart
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

// 2️⃣ Get cart
export async function getCartService(userId) {
  return getOrCreateCart(userId);
}

// 3️⃣ Add to cart
export async function addToCartService(userId, productId, quantity = 1) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product || !product.isActive) {
    throw new Error("Product not available");
  }

  if (product.stock < quantity) {
    throw new Error("Insufficient stock");
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
    throw new Error("Quantity must be greater than zero");
  }

  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true },
  });

  if (!item || item.cart.userId !== userId) {
    throw new Error("Cart item not found");
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
    throw new Error("Cart item not found");
  }

  await prisma.cartItem.delete({
    where: { id: itemId },
  });
}
