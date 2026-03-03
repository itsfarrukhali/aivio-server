import type { Request, Response, NextFunction } from "express";
import { ApiResponseUtil } from "../utils/apiResponse.js";
import type { AspectRatio } from "../types/index.js";

const VALID_ASPECT_RATIOS: AspectRatio[] = ["9:16", "16:9", "1:1"];
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

export const validateCreateProject = (
  req: Request,
  res: Response,
  next: NextFunction
): void | Response => {
  const { name, productName, aspectRatio } = req.body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return ApiResponseUtil.badRequest(
      res,
      "Project name is required and must be a non-empty string"
    );
  }

  if (
    !productName ||
    typeof productName !== "string" ||
    productName.trim().length === 0
  ) {
    return ApiResponseUtil.badRequest(
      res,
      "Product name is required and must be a non-empty string"
    );
  }

  if (!aspectRatio || !VALID_ASPECT_RATIOS.includes(aspectRatio)) {
    return ApiResponseUtil.badRequest(
      res,
      "Valid aspect ratio is required (9:16, 16:9, or 1:1)"
    );
  }

  if (name.length > MAX_NAME_LENGTH) {
    return ApiResponseUtil.badRequest(
      res,
      `Project name must be ${MAX_NAME_LENGTH} characters or less`
    );
  }

  if (productName.length > MAX_NAME_LENGTH) {
    return ApiResponseUtil.badRequest(
      res,
      `Product name must be ${MAX_NAME_LENGTH} characters or less`
    );
  }

  next();
};

export const validateUpdateProject = (
  req: Request,
  res: Response,
  next: NextFunction
): void | Response => {
  const { name, productName, productDescription, aspectRatio, isPublished } =
    req.body;

  if (
    name !== undefined &&
    (typeof name !== "string" || name.trim().length === 0)
  ) {
    return ApiResponseUtil.badRequest(
      res,
      "Project name must be a non-empty string"
    );
  }

  if (
    productName !== undefined &&
    (typeof productName !== "string" || productName.trim().length === 0)
  ) {
    return ApiResponseUtil.badRequest(
      res,
      "Product name must be a non-empty string"
    );
  }

  if (
    productDescription !== undefined &&
    typeof productDescription === "string" &&
    productDescription.length > MAX_DESCRIPTION_LENGTH
  ) {
    return ApiResponseUtil.badRequest(
      res,
      `Product description must be ${MAX_DESCRIPTION_LENGTH} characters or less`
    );
  }

  if (aspectRatio !== undefined && !VALID_ASPECT_RATIOS.includes(aspectRatio)) {
    return ApiResponseUtil.badRequest(
      res,
      "Aspect ratio must be 9:16, 16:9, or 1:1"
    );
  }

  if (isPublished !== undefined && typeof isPublished !== "boolean") {
    return ApiResponseUtil.badRequest(res, "isPublished must be a boolean");
  }

  next();
};
