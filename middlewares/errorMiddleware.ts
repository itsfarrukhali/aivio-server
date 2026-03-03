import type { Request, Response, NextFunction } from "express";
import { handleError } from "../utils/errorHandler.js";
import type { ApiResponse } from "../types/express.js";

export const errorMiddleware = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  handleError(error, res);
};

export const notFoundMiddleware = (req: Request, res: Response): void => {
  const response: ApiResponse<null> = {
    success: false,
    message: `Route ${req.originalUrl} not found`,
  };
  res.status(404).json(response);
};
