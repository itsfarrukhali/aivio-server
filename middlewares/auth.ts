import type { Request, Response, NextFunction } from "express";
import { ApiResponseUtil } from "../utils/apiResponse.js";
import * as Sentry from "@sentry/node";

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    const auth = req.auth();

    if (!auth || !auth.userId) {
      return ApiResponseUtil.unauthorized(
        res,
        "Authentication required. Please sign in to continue."
      );
    }

    next();
  } catch (error: unknown) {
    Sentry.captureException(error, {
      tags: {
        middleware: "auth",
      },
      extra: {
        path: req.path,
        method: req.method,
      },
    });
    if (error instanceof Error) {
      console.error("Auth Error:", error.message);
    } else {
      console.error("Auth Error:", error);
    }
    return ApiResponseUtil.unauthorized(res, "Authentication failed");
  }
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    req.auth();
    next();
  } catch (error: unknown) {
    Sentry.captureException(error, {
      tags: {
        middleware: "auth",
      },
      extra: {
        path: req.path,
        method: req.method,
      },
    });
    // Optional auth - just continue regardless
    next();
  }
};
