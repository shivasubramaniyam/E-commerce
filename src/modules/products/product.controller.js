import {
  createProductService,
  getAllProductsServie,
  getProductByIdServie,
  updateProductService,
  deleteProductService,
} from "./product.service.js";

export async function createProduct(req, res) {
  try {
    const product = await createProductService(req.body);
    console.log("BODY:", req.body);
    res.status(201).json(product);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}

export async function getAllProducts(req, res) {
  const products = await getAllProductsServie();
  res.json(products);
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
