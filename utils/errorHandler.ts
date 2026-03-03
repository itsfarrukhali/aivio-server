import type { Response } from "express";
import { ApiResponseUtil } from "./apiResponse.js";
import type { PrismaError } from "../types/index.js";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleError = (error: unknown, res: Response): Response => {
  // Handle AppError instances
  if (error instanceof AppError) {
    return ApiResponseUtil.error(
      res,
      error.message,
      error.statusCode,
      process.env.NODE_ENV === "development" ? error.stack : undefined
    );
  }

  // Handle Prisma errors
  const prismaError = error as PrismaError;
  if (prismaError.code) {
    if (prismaError.code === "P2002") {
      return ApiResponseUtil.conflict(
        res,
        "A record with this data already exists"
      );
    }

    if (prismaError.code === "P2025") {
      return ApiResponseUtil.notFound(res, "Record not found");
    }

    if (prismaError.code === "P2003") {
      return ApiResponseUtil.badRequest(res, "Invalid reference data");
    }
  }

  // Handle validation errors
  if (error instanceof Error && error.name === "ValidationError") {
    return ApiResponseUtil.badRequest(res, error.message);
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    console.error("Unhandled Error:", error);
    return ApiResponseUtil.serverError(
      res,
      "An unexpected error occurred",
      process.env.NODE_ENV === "development" ? error.message : undefined
    );
  }

  // Handle unknown error types
  console.error("Unknown Error Type:", error);
  return ApiResponseUtil.serverError(
    res,
    "An unexpected error occurred",
    process.env.NODE_ENV === "development" ? String(error) : undefined
  );
};
