import type { Request, Response } from "express";
import * as Sentry from "@sentry/node";
import { handleError } from "../utils/errorHandler.js";
import { prisma } from "../configs/prisma.js";
import { ApiResponseUtil } from "../utils/apiResponse.js";
import type {
  CreditsResponse,
  PaginatedProjectsResponse,
  ProjectDetailResponse,
  TogglePublishResponse,
  UpdateUserRequest,
  UserProfileResponse,
  UserStatsResponse,
} from "../types/index.js";

// Get user profile
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
    Sentry.captureException(error, {
      tags: { controller: "user", action: "getUserProfile" },
    });
    return handleError(error, res);
  }
};

// Update user profile
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
    Sentry.captureException(error, {
      tags: { controller: "user", action: "updateUserProfile" },
    });
    return handleError(error, res);
  }
};

// get user credits
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
    Sentry.captureException(error, {
      tags: { controller: "user", action: "getUserCredits" },
    });
    return handleError(error, res);
  }
};

// Get user stats
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
    Sentry.captureException(error, {
      tags: { controller: "user", action: "getUserStats" },
    });
    return handleError(error, res);
  }
};

// get all projects user has access to
export const getAllProjects = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { userId } = req.auth();

    if (!userId) {
      return ApiResponseUtil.unauthorized(res);
    }

    const { page = "1", limit = "10", search = "" } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where = {
      userId,
      ...(search && {
        name: {
          contains: search as string,
          mode: "insensitive" as const,
        },
      }),
    };

    const [projects, total] = await prisma.$transaction([
      prisma.project.findMany({
        where,
        select: {
          id: true,
          name: true,
          generatedImage: true,
          generatedVideo: true,
          isPublished: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.project.count({ where }),
    ]);

    return ApiResponseUtil.success<PaginatedProjectsResponse>(
      res,
      {
        projects,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
      "Projects retrieved successfully"
    );
  } catch (error: unknown) {
    Sentry.captureException(error, {
      tags: { controller: "user", action: "getAllProjects" },
    });
    return handleError(error, res);
  }
};

// get project by id
export const getProjectById = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { userId } = req.auth();
    const { projectId } = req.params;

    if (!userId) {
      return ApiResponseUtil.unauthorized(res);
    }

    if (!projectId) {
      return ApiResponseUtil.notFound(res, "Project ID is required");
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId as string,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!project) {
      return ApiResponseUtil.notFound(res, "Project not found");
    }

    return ApiResponseUtil.success<ProjectDetailResponse>(
      res,
      project,
      "Project retrieved successfully"
    );
  } catch (error: unknown) {
    Sentry.captureException(error, {
      tags: { controller: "user", action: "getProjectById" },
      extra: { projectId: req.params.projectId },
    });
    return handleError(error, res);
  }
};

// publish / unpublish project publicily
export const toggleProjectPublish = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { userId } = req.auth();
    const { projectId } = req.params;

    if (!userId) {
      return ApiResponseUtil.unauthorized(res);
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId as string,
        userId,
      },
    });

    if (!project) {
      return ApiResponseUtil.notFound(res, "Project not found");
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId as string },
      data: { isPublished: !project.isPublished },
      select: {
        id: true,
        name: true,
        isPublished: true,
        updatedAt: true,
      },
    });

    return ApiResponseUtil.success<TogglePublishResponse>(
      res,
      updatedProject,
      `Project ${
        updatedProject.isPublished ? "published" : "unpublished"
      } successfully`
    );
  } catch (error: unknown) {
    Sentry.captureException(error, {
      tags: { controller: "user", action: "toggleProjectPublish" },
      extra: { projectId: req.params.projectId },
    });
    return handleError(error, res);
  }
};
