import {
  getCartService,
  addToCartService,
  updateCartItemService,
  removeCartItemService,
} from "./cart.service.js";

export async function getCart(req, res) {
  const cart = await getCartService(req.user.userId);
  res.json(cart);
}

export async function addToCart(req, res) {
  try {
    const cart = await addToCartService(
      req.user.userId,
      req.body.productId,
      req.body.quantity,
    );
    res.status(201).json(cart);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function updateCartItem(req, res) {
  try {
    const cart = await updateCartItemService(
      req.user.userId,
      req.params.itemId,
      req.body.quantity,
    );
    res.json(cart);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function removeCartItem(req, res) {
  try {
    await removeCartItemService(req.user.userId, req.params.itemId);
    res.json({ message: "Item removed from cart" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
