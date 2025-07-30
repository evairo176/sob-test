import { StatusCodes } from "http-status-codes";
import { db } from "@/db/db";
import type { AppHandler } from "@/lib/types";

export const listProducts: AppHandler = async (req, res) => {
  try {
    const products = await db.product.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    return res.status(StatusCodes.OK).json(products);
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to fetch products",
    });
  }
};

export const createProduct: AppHandler = async (req, res) => {
  try {
    const product = await db.product.create({
      data: req.body,
    });
    return res.status(StatusCodes.CREATED).json(product);
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to create product",
    });
  }
};

export const getProduct: AppHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await db.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Product not found",
      });
    }

    return res.status(StatusCodes.OK).json(product);
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to fetch product",
    });
  }
};

export const updateProduct: AppHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const existingProduct = await db.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Product not found",
      });
    }

    const updatedProduct = await db.product.update({
      where: { id },
      data: req.body,
    });

    return res.status(StatusCodes.OK).json(updatedProduct);
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to update product",
    });
  }
};

export const deleteProduct: AppHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const existingProduct = await db.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Product not found",
      });
    }

    await db.product.delete({
      where: { id },
    });

    return res.status(StatusCodes.OK).json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Failed to delete product",
    });
  }
};
