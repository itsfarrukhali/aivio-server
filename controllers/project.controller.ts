import type { Request, Response } from "express";
import { prisma } from "../configs/prisma.js";
import { ApiResponseUtil } from "../utils/apiResponse.js";
import { handleError, AppError } from "../utils/errorHandler.js";
import type {
  CreateProjectRequest,
  UpdateProjectRequest,
  GetProjectsQuery,
  GetPublicProjectsQuery,
  ProjectWhereInput,
  ProjectFilter,
} from "../types/index.js";

export const createProject = async (
  req: Request<unknown, unknown, CreateProjectRequest>,
  res: Response
): Promise<Response> => {
  try {
    const { userId } = req.auth();
    if (!userId) {
      return ApiResponseUtil.unauthorized(res);
    }

    const {
      name,
      productName,
      productDescription,
      userPrompt,
      aspectRatio,
      targetLength,
      uploadedImages,
    } = req.body;

    // Check user credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    if (!user) {
      return ApiResponseUtil.notFound(res, "User not found");
    }

    if (user.credits < 2) {
      return ApiResponseUtil.badRequest(
        res,
        "Insufficient credits. Please upgrade your plan to continue."
      );
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        userId,
        productName: productName.trim(),
        productDescription: productDescription?.trim() || "",
        userPrompt: userPrompt?.trim() || "",
        aspectRatio: aspectRatio || "9:16",
        targetLength: targetLength || 5,
        uploadedImages: uploadedImages || [],
        isGenerating: true,
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

    // Deduct credits (2 for image, will add more for video later)
    await prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: 2 } },
    });

    return ApiResponseUtil.created(
      res,
      project,
      "Project created successfully. Generation started!"
    );
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

export const getProjectById = async (
  req: Request<{ projectId: string }>,
  res: Response
): Promise<Response> => {
  try {
    const { userId } = req.auth();
    const { projectId } = req.params;

    if (!projectId || typeof projectId !== "string") {
      return ApiResponseUtil.badRequest(res, "Valid Project ID is required");
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
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

    // Check if user has access (either owner or public)
    if (project.userId !== userId && !project.isPublished) {
      return ApiResponseUtil.forbidden(
        res,
        "You don't have access to this project"
      );
    }

    return ApiResponseUtil.success(
      res,
      project,
      "Project retrieved successfully"
    );
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

export const getUserProjects = async (
  req: Request<unknown, unknown, unknown, GetProjectsQuery>,
  res: Response
): Promise<Response> => {
  try {
    const { userId } = req.auth();
    if (!userId) {
      return ApiResponseUtil.unauthorized(res);
    }

    const { page = "1", limit = "20", filter = "all" } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter conditions with proper typing
    const where: any = { userId };

    if (filter === "images") {
      where.generatedImage = { not: "" };
      where.generatedVideo = { equals: "" };
    } else if (filter === "videos") {
      where.generatedVideo = { not: "" };
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return ApiResponseUtil.success(
      res,
      {
        projects,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
      "Projects retrieved successfully"
    );
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

export const updateProject = async (
  req: Request<{ projectId: string }, unknown, UpdateProjectRequest>,
  res: Response
): Promise<Response> => {
  try {
    const { userId } = req.auth();
    const { projectId } = req.params;

    if (!userId) {
      return ApiResponseUtil.unauthorized(res);
    }

    if (!projectId || typeof projectId !== "string") {
      return ApiResponseUtil.badRequest(res, "Valid Project ID is required");
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return ApiResponseUtil.notFound(res, "Project not found");
    }

    if (project.userId !== userId) {
      return ApiResponseUtil.forbidden(
        res,
        "You don't have permission to update this project"
      );
    }

    const {
      name,
      productName,
      productDescription,
      userPrompt,
      generatedImage,
      generatedVideo,
      isGenerating,
      isPublished,
      error,
    } = req.body;

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(productName !== undefined && { productName: productName.trim() }),
        ...(productDescription !== undefined && {
          productDescription: productDescription.trim(),
        }),
        ...(userPrompt !== undefined && { userPrompt: userPrompt.trim() }),
        ...(generatedImage !== undefined && { generatedImage }),
        ...(generatedVideo !== undefined && { generatedVideo }),
        ...(isGenerating !== undefined && { isGenerating }),
        ...(isPublished !== undefined && { isPublished }),
        ...(error !== undefined && { error }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return ApiResponseUtil.success(
      res,
      updatedProject,
      "Project updated successfully"
    );
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

export const deleteProject = async (
  req: Request<{ projectId: string }>,
  res: Response
): Promise<Response> => {
  try {
    const { userId } = req.auth();
    const { projectId } = req.params;

    if (!userId) {
      return ApiResponseUtil.unauthorized(res);
    }

    if (!projectId || typeof projectId !== "string") {
      return ApiResponseUtil.badRequest(res, "Valid Project ID is required");
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return ApiResponseUtil.notFound(res, "Project not found");
    }

    if (project.userId !== userId) {
      return ApiResponseUtil.forbidden(
        res,
        "You don't have permission to delete this project"
      );
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    return ApiResponseUtil.success(
      res,
      { id: projectId },
      "Project deleted successfully"
    );
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

export const getPublicProjects = async (
  req: Request<unknown, unknown, unknown, GetPublicProjectsQuery>,
  res: Response
): Promise<Response> => {
  try {
    const { page = "1", limit = "20" } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: {
          isPublished: true,
          OR: [
            { generatedImage: { not: "" } },
            { generatedVideo: { not: "" } },
          ],
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      }),
      prisma.project.count({
        where: {
          isPublished: true,
          OR: [
            { generatedImage: { not: "" } },
            { generatedVideo: { not: "" } },
          ],
        },
      }),
    ]);

    return ApiResponseUtil.success(
      res,
      {
        projects,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
      "Public projects retrieved successfully"
    );
  } catch (error: unknown) {
    return handleError(error, res);
  }
};

export const togglePublishProject = async (
  req: Request<{ projectId: string }>,
  res: Response
): Promise<Response> => {
  try {
    const { userId } = req.auth();
    const { projectId } = req.params;

    if (!userId) {
      return ApiResponseUtil.unauthorized(res);
    }

    if (!projectId || typeof projectId !== "string") {
      return ApiResponseUtil.badRequest(res, "Valid Project ID is required");
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return ApiResponseUtil.notFound(res, "Project not found");
    }

    if (project.userId !== userId) {
      return ApiResponseUtil.forbidden(
        res,
        "You don't have permission to publish this project"
      );
    }

    if (!project.generatedImage && !project.generatedVideo) {
      return ApiResponseUtil.badRequest(
        res,
        "Cannot publish a project without generated content"
      );
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { isPublished: !project.isPublished },
    });

    return ApiResponseUtil.success(
      res,
      updatedProject,
      `Project ${
        updatedProject.isPublished ? "published" : "unpublished"
      } successfully`
    );
  } catch (error: unknown) {
    return handleError(error, res);
  }
};
