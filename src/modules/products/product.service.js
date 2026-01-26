import prisma from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";

export async function createProductService(data) {
  const { name, description, price, stock } = data;

  if (!name || price === undefined || stock === undefined) {
    throw new AppError("Missing required fields");
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

export async function getAllProductsServie(query) {
  const {
    page = 1,
    limit = 10,
    minPrice,
    maxPrice,
    inStock,
    sortBy = "createdAt",
    order = "desc",
  } = query;

  const skip = (page - 1) * limit;

  const where = {
    isActive: true,
  };

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = Number(minPrice);
    if (maxPrice) where.price.lte = Number(maxPrice);
  }

  if (inStock === "true") {
    where.stock = { gt: 0 };
  }

  const products = await prisma.product.findMany({
    where,
    skip,
    take: Number(limit),
    orderBy: {
      [sortBy]: order,
    },
  });

  const total = await prisma.product.count({ where });
  return {
    data: products,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getProductByIdServie(id) {
  const product = await prisma.product.findUnique({
    where: { id },
  });
  if (!product || !product.isActive) {
    throw new AppError("Product not found", 404);
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
