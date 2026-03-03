import type { Request, Response } from "express";
import { prisma } from "../configs/prisma.js";
import { ApiResponseUtil } from "../utils/apiResponse.js";
import { handleError } from "../utils/errorHandler.js";
import type {
  UpdateUserRequest,
  UserProfileResponse,
  CreditsResponse,
  UserStatsResponse,
} from "../types/index.js";

export const getUserProfile = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { userId } = req.auth();

    if (!userId) {
      return ApiResponseUtil.unauthorized(res);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        credits: true,
        createdAt: true,
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    if (!user) {
      return ApiResponseUtil.notFound(res, "User not found");
    }

    return ApiResponseUtil.success<UserProfileResponse>(
      res,
      user,
      "User profile retrieved successfully"
    );
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

export const updateUserProfile = async (
  req: Request<unknown, unknown, UpdateUserRequest>,
  res: Response
): Promise<Response> => {
  try {
    const { userId } = req.auth();
    const { name, image } = req.body;

    if (!userId) {
      return ApiResponseUtil.unauthorized(res);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(image && { image }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        credits: true,
      },
    });

    return ApiResponseUtil.success(
      res,
      updatedUser,
      "Profile updated successfully"
    );
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

export const getUserCredits = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { userId } = req.auth();

    if (!userId) {
      return ApiResponseUtil.unauthorized(res);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        credits: true,
      },
    });

    if (!user) {
      return ApiResponseUtil.notFound(res, "User not found");
    }

    return ApiResponseUtil.success<CreditsResponse>(
      res,
      { credits: user.credits },
      "Credits retrieved successfully"
    );
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

export const getUserStats = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { userId } = req.auth();

    if (!userId) {
      return ApiResponseUtil.unauthorized(res);
    }

    const stats = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        credits: true,
        _count: {
          select: {
            projects: true,
          },
        },
        projects: {
          select: {
            generatedImage: true,
            generatedVideo: true,
            createdAt: true,
          },
        },
      },
    });

    if (!stats) {
      return ApiResponseUtil.notFound(res, "User not found");
    }

    const totalProjects = stats._count.projects;
    const imagesGenerated = stats.projects.filter(
      (p) => p.generatedImage && p.generatedImage !== ""
    ).length;
    const videosGenerated = stats.projects.filter(
      (p) => p.generatedVideo && p.generatedVideo !== ""
    ).length;

    // Calculate projects this month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const projectsThisMonth = stats.projects.filter(
      (p) => new Date(p.createdAt) >= firstDayOfMonth
    ).length;

    const userStats: UserStatsResponse = {
      credits: stats.credits,
      totalProjects,
      imagesGenerated,
      videosGenerated,
      projectsThisMonth,
    };

    return ApiResponseUtil.success<UserStatsResponse>(
      res,
      userStats,
      "User stats retrieved successfully"
    );
  } catch (error: unknown) {
    return handleError(error, res);
  }
};
