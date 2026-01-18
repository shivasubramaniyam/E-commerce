import prisma from "../../config/db.js";

export async function createProductService(data) {
  const { name, description, price, stock } = data;

  if (!name || price === undefined || stock === undefined) {
    throw new Error("Missing required fields");
  }

  return prisma.product.create({
    data: {
      name,
      description,
      price,
      stock,
    },
  });
}

export async function getAllProductsServie() {
  return prisma.product.findMany({
    where: { isActive: true },
  });
}

export async function getProductByIdServie(id) {
  const product = await prisma.product.findUnique({
    where: { id },
  });
  if (!product || !product.isActive) {
    throw new Error("Product not found");
  }
  return product;
}

export async function updateProductService(id, data) {
  return prisma.product.update({
    where: { id },
    data,
  });
}

export async function deleteProductService(id) {
  return prisma.product.update({
    where: { id },
    data: { isActive: false },
  });
}
