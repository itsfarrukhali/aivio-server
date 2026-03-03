import type { Response } from "express";
import type { ApiResponse } from "../types/express.js";

export class ApiResponseUtil {
  static success<T>(
    res: Response,
    data: T,
    message: string = "Success",
    statusCode: number = 200
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
    };
    return res.status(statusCode).json(response);
  }

  static error(
    res: Response,
    message: string = "An error occurred",
    statusCode: number = 500,
    error?: string
  ): Response {
    const response: ApiResponse<never> = {
      success: false,
      message,
      ...(error && { error }),
    };
    return res.status(statusCode).json(response);
  }

  static created<T>(
    res: Response,
    data: T,
    message: string = "Resource created successfully"
  ): Response {
    return this.success(res, data, message, 201);
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  static badRequest(
    res: Response,
    message: string = "Bad request",
    error?: string
  ): Response {
    return this.error(res, message, 400, error);
  }

  static unauthorized(
    res: Response,
    message: string = "Unauthorized"
  ): Response {
    return this.error(res, message, 401);
  }

  static forbidden(res: Response, message: string = "Forbidden"): Response {
    return this.error(res, message, 403);
  }

  static notFound(
    res: Response,
    message: string = "Resource not found"
  ): Response {
    return this.error(res, message, 404);
  }

  static conflict(
    res: Response,
    message: string = "Resource already exists"
  ): Response {
    return this.error(res, message, 409);
  }

  static serverError(
    res: Response,
    message: string = "Internal server error",
    error?: string
  ): Response {
    return this.error(res, message, 500, error);
  }
}
