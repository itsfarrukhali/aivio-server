import type { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      auth: () => {
        userId?: string | null;
        sessionId?: string | null;
        orgId?: string | null;
      };
      file?: {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        buffer: Buffer;
        path: string;
      };
      files?: {
        [fieldname: string]: {
          fieldname: string;
          originalname: string;
          encoding: string;
          mimetype: string;
          size: number;
          buffer: Buffer;
          path: string;
        }[];
      };
    }
  }
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T = unknown> {
  success: boolean;
  message: string;
  data: {
    projects?: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
