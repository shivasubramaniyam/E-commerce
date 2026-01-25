import {
  checkoutOrderService,
  getMyOrdersService,
  getOrderByIdService,
  updateOrderStatusService,
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

// ADMIN ONLY
export async function updateOrderStatus(req, res) {
  try {
    const order = await updateOrderStatusService(
      req.params.id,
      req.body.status,
    );
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
