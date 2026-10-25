import {
  createProductService,
  getAllProductsServie,
  getProductByIdServie,
  updateProductService,
  deleteProductService,
} from "./product.service.js";

export async function createProduct(req, res, next) {
  try {
    const product = await createProductService(req.body);
    res.status(201).json(product);
  } catch (e) {
    next(e);
  }
}

export async function getAllProducts(req, res, next) {
  try {
    const products = await getAllProductsServie(req.query);
    res.json(products);
  } catch (e) {
    next(e);
  }
}

export async function getProductById(req, res) {
  try {
    const product = await getProductByIdServie(req.params.id);
    res.json(product);
  } catch (e) {
    res.status(404).json({ message: e.message });
  }
}

export async function updateProduct(req, res) {
  try {
    const product = await updateProductService(req.params.id, req.body);
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function deleteProduct(req, res) {
  try {
    await deleteProductService(req.params.id);
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
