// ============================================
// DATABASE MODELS - Match Prisma Schema
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  image: string;
  credits: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  userId: string;
  productName: string;
  productDescription: string;
  userPrompt: string;
  aspectRatio: string;
  targetLength: number;
  uploadedImages: string[];
  generatedImage: string;
  generatedVideo: string;
  isGenerating: boolean;
  isPublished: boolean;
  error: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// API REQUEST TYPES
// ============================================

export interface CreateProjectRequest {
  name: string;
  productName: string;
  productDescription?: string;
  userPrompt?: string;
  aspectRatio?: "9:16" | "16:9" | "1:1";
  targetLength?: number;
  uploadedImages?: string[];
}

export interface UpdateProjectRequest {
  name?: string;
  productName?: string;
  productDescription?: string;
  userPrompt?: string;
  aspectRatio?: "9:16" | "16:9" | "1:1";
  targetLength?: number;
  generatedImage?: string;
  generatedVideo?: string;
  isGenerating?: boolean;
  isPublished?: boolean;
  error?: string;
}

export interface UpdateUserRequest {
  name?: string;
  image?: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface UserProfileResponse {
  id: string;
  email: string;
  name: string;
  image: string;
  credits: number;
  createdAt: Date;
  _count: {
    projects: number;
  };
}

export interface ProjectResponse {
  id: string;
  name: string;
  userId: string;
  productName: string;
  productDescription: string;
  userPrompt: string;
  aspectRatio: string;
  targetLength: number;
  uploadedImages: string[];
  generatedImage: string;
  generatedVideo: string;
  isGenerating: boolean;
  isPublished: boolean;
  error: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    image: string;
  };
}

export interface PaginatedProjectsResponse {
  projects: ProjectResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserStatsResponse {
  credits: number;
  totalProjects: number;
  imagesGenerated: number;
  videosGenerated: number;
  projectsThisMonth: number;
}

export interface CreditsResponse {
  credits: number;
}

// ============================================
// CLERK WEBHOOK TYPES
// ============================================

export interface ClerkWebhookEvent {
  data: ClerkWebhookData;
  object: string;
  type: ClerkWebhookEventType;
}

export type ClerkWebhookEventType =
  | "user.created"
  | "user.updated"
  | "user.deleted"
  | "session.created"
  | "session.ended"
  | "session.removed"
  | "session.revoked"
  | "email.created"
  | "sms.created"
  | "paymentAttempt.updated";

export interface ClerkWebhookData {
  id: string;
  object?: string;
  first_name?: string;
  last_name?: string;
  email_addresses?: Array<{
    email_address: string;
    id: string;
    linked_to: string[];
    object: string;
    verification: {
      status: string;
      strategy: string;
    };
  }>;
  image_url?: string;
  username?: string;
  external_id?: string;
  created_at?: number;
  updated_at?: number;
  // Payment webhook fields
  charge_type?: "recurring" | "checkout" | "one_time";
  status?: "pending" | "paid" | "failed";
  payer?: {
    user_id?: string;
    email?: string;
  };
  subscription_items?: Array<{
    plan_slug?: string;
    quantity?: number;
  }>;
}

// ============================================
// QUERY PARAMS TYPES
// ============================================

export interface GetProjectsQuery {
  page?: string;
  limit?: string;
  filter?: "all" | "images" | "videos";
}

export interface GetPublicProjectsQuery {
  page?: string;
  limit?: string;
}

// ============================================
// PRISMA WHERE CLAUSE TYPES
// ============================================

export interface ProjectWhereInput {
  userId?: string;
  isPublished?: boolean;
  generatedImage?: {
    not: string;
  };
  generatedVideo?: {
    not: string;
  };
  OR?: Array<{
    generatedImage?: { not: string };
    generatedVideo?: { not: string };
  }>;
  AND?: ProjectWhereInput[];
}

// ============================================
// ERROR TYPES
// ============================================

export interface PrismaError extends Error {
  code?: string;
  meta?: {
    target?: string[];
    cause?: string;
  };
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

// ============================================
// AUTH TYPES
// ============================================

export interface AuthenticatedUser {
  userId: string;
}

export interface ClerkAuthObject {
  userId: string | null | undefined;
  sessionId?: string | null;
  orgId?: string | null;
}

// ============================================
// CREDIT PLAN TYPES
// ============================================

export type PlanType = "pro" | "business";

export interface CreditPlan {
  [key: string]: number;
  pro: number;
  business: number;
}

// ============================================
// UTILITY TYPES
// ============================================

export type AspectRatio = "9:16" | "16:9" | "1:1";

export type ProjectFilter = "all" | "images" | "videos";

export interface HealthCheckResponse {
  status: string;
  uptime?: number;
  timestamp: string;
  version?: string;
}
