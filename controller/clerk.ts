import type { Request, Response } from "express";
import { Webhook } from "svix";
import { prisma } from "../configs/prisma.js";
import { ApiResponseUtil } from "../utils/apiResponse.js";
import { handleError } from "../utils/errorHandler.js";
import type {
  ClerkWebhookEvent,
  ClerkWebhookData,
  CreditPlan,
  PlanType,
} from "../types/index.js";

const clerkWebhooks = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // Get the Svix headers for verification
    const svixId = req.headers["svix-id"] as string;
    const svixTimestamp = req.headers["svix-timestamp"] as string;
    const svixSignature = req.headers["svix-signature"] as string;

    // Check if we have all required headers
    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error("❌ Missing Svix headers");
      return ApiResponseUtil.badRequest(
        res,
        "Missing webhook verification headers"
      );
    }

    // Get the webhook secret from environment
    const webhookSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
    if (!webhookSecret) {
      console.error("❌ CLERK_WEBHOOK_SIGNING_SECRET is not configured");
      return ApiResponseUtil.serverError(res, "Webhook secret not configured");
    }

    // Get the raw body
    const payload = req.body;
    const body = payload.toString();

    // Create a new Svix instance with your webhook secret
    const wh = new Webhook(webhookSecret);

    let evt: ClerkWebhookEvent;

    // Verify the webhook signature
    try {
      evt = wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as ClerkWebhookEvent;
    } catch (err) {
      console.error("❌ Webhook verification failed:", err);
      return ApiResponseUtil.unauthorized(res, "Invalid webhook signature");
    }

    // Getting Data from Request
    const { data, type } = evt;

    console.log(`📥 Webhook received: ${type}`);

    // Switch cases for Different Events
    switch (type) {
      case "user.created": {
        await handleUserCreated(data);
        console.log(`✅ User created: ${data.id}`);
        break;
      }

      case "user.updated": {
        await handleUserUpdated(data);
        console.log(`✅ User updated: ${data.id}`);
        break;
      }

      case "user.deleted": {
        await handleUserDeleted(data);
        console.log(`✅ User deleted: ${data.id}`);
        break;
      }

      default: {
        console.log(`ℹ️ Unhandled webhook type: ${type}`);
      }
    }

    return ApiResponseUtil.success(
      res,
      { received: true },
      `Webhook processed: ${type}`
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("❌ Webhook Error:", error.message);
      console.error("Stack:", error.stack);
    } else {
      console.error("❌ Webhook Error:", error);
    }
    return handleError(error, res);
  }
};

// Helper Functions
async function handleUserCreated(data: ClerkWebhookData): Promise<void> {
  const email = data.email_addresses?.[0]?.email_address || "";
  const firstName = data.first_name || "";
  const lastName = data.last_name || "";
  const name = `${firstName} ${lastName}`.trim() || data.username || "User";
  const image = data.image_url || "";

  console.log(`📝 Creating user in database:`, {
    id: data.id,
    email,
    name,
    image,
  });

  try {
    await prisma.user.create({
      data: {
        id: data.id,
        email,
        name,
        image,
      },
    });
    console.log(`✅ User successfully created in database`);
  } catch (error) {
    // Check if user already exists
    if (error instanceof Error && "code" in error && error.code === "P2002") {
      console.log(
        `ℹ️ User ${data.id} already exists in database, skipping creation`
      );
      // Update the user instead
      await prisma.user.update({
        where: { id: data.id },
        data: { email, name, image },
      });
      console.log(`✅ User updated instead`);
    } else {
      throw error; // Re-throw if it's a different error
    }
  }
}

async function handleUserUpdated(data: ClerkWebhookData): Promise<void> {
  const email = data.email_addresses?.[0]?.email_address || "";
  const firstName = data.first_name || "";
  const lastName = data.last_name || "";
  const name = `${firstName} ${lastName}`.trim() || data.username || "User";
  const image = data.image_url || "";

  console.log(`📝 Updating user in database:`, {
    id: data.id,
    email,
    name,
  });

  try {
    await prisma.user.update({
      where: { id: data.id },
      data: { email, name, image },
    });
    console.log(`✅ User successfully updated in database`);
  } catch (error) {
    // If user doesn't exist, create them instead
    if (error instanceof Error && "code" in error && error.code === "P2025") {
      console.log(`ℹ️ User ${data.id} not found, creating instead`);
      await prisma.user.create({
        data: {
          id: data.id,
          email,
          name,
          image,
        },
      });
      console.log(`✅ User created instead`);
    } else {
      throw error; // Re-throw if it's a different error
    }
  }
}

async function handleUserDeleted(data: ClerkWebhookData): Promise<void> {
  console.log(`🗑️ Attempting to delete user from database: ${data.id}`);

  try {
    // First check if user exists
    const user = await prisma.user.findUnique({
      where: { id: data.id },
      select: { id: true, email: true },
    });

    if (!user) {
      console.log(
        `ℹ️ User ${data.id} not found in database, skipping deletion`
      );
      return; // Exit gracefully if user doesn't exist
    }

    // Delete user's projects first (cascade should handle this, but being explicit)
    const deletedProjects = await prisma.project.deleteMany({
      where: { userId: data.id },
    });

    if (deletedProjects.count > 0) {
      console.log(
        `🗑️ Deleted ${deletedProjects.count} projects for user ${data.id}`
      );
    }

    // Now delete the user
    await prisma.user.delete({
      where: { id: data.id },
    });

    console.log(`✅ User ${user.email} successfully deleted from database`);
  } catch (error) {
    // Handle the case where user was already deleted
    if (error instanceof Error && "code" in error && error.code === "P2025") {
      console.log(`ℹ️ User ${data.id} was already deleted from database`);
      return; // Exit gracefully
    }

    // Re-throw other errors
    throw error;
  }
}

export default clerkWebhooks;
