import {
  checkoutOrderService,
  getMyOrdersService,
  getOrderByIdService,
} from "./order.service.js";

export async function checkOutOrder(req, res) {
  try {
    const order = await checkoutOrderService(req.user.userId);
    res.status(201).json(order);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

export async function getMyOrder(req, res) {
  const orders = await getMyOrdersService(req.user.userId);
  res.json(orders);
}

export async function getOrderById(req, res) {
  try {
    const order = await getOrderByIdService(req.user.userId, req.params.id);
    res.json(order);
  } catch (e) {
    res.status(404).json({ message: e.message });
  }
}
