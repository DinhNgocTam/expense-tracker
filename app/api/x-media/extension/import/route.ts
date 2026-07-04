import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createHash } from "crypto";
import { validateExtensionImportRequest } from "@/lib/x-media/validators";
import { uploadImageFromUrl, deleteImage } from "@/lib/cloudinary/server";
import { findExistingMediaItem, createMediaItem } from "@/lib/x-media/repository";
import type { ApiResponse } from "@/lib/x-media/types";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  process.env.X_MEDIA_EXTENSION_ORIGIN,
].filter(Boolean);

function getCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get("origin");
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin || "")
    ? (origin || "http://localhost:3000")
    : (ALLOWED_ORIGINS[0] || "http://localhost:3000");

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

interface ImportResult {
  postId: string;
  mediaIndex: number;
  status: "archived" | "skipped" | "failed";
  itemId?: string;
  reason?: string;
}

interface TokenVerificationResult {
  valid: boolean;
  userId?: string;
  errorCode?: string;
}

async function verifyExtensionToken(
  supabase: Awaited<ReturnType<typeof createClient>>,
  token: string
): Promise<TokenVerificationResult> {
  const tokenHash = hashToken(token);

  const { data, error } = await supabase
    .from("extension_tokens")
    .select("id, user_id, expires_at, revoked_at")
    .eq("token_hash", tokenHash)
    .single();

  if (error || !data) {
    return { valid: false, errorCode: "EXTENSION_TOKEN_NOT_FOUND" };
  }

  if (data.revoked_at) {
    return { valid: false, errorCode: "EXTENSION_TOKEN_REVOKED" };
  }

  const expiresAt = new Date(data.expires_at);
  if (expiresAt < new Date()) {
    return { valid: false, errorCode: "EXTENSION_TOKEN_EXPIRED" };
  }

  return { valid: true, userId: data.user_id };
}

export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ summary: { requested: number; archived: number; skipped: number; failed: number }; results: ImportResult[] }>>> {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "EXTENSION_TOKEN_MISSING",
            message: "Missing authorization header.",
          },
        },
        { status: 401, headers: getCorsHeaders(request) }
      );
    }

    const token = authHeader.substring(7);
    if (!token || token.length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "EXTENSION_TOKEN_INVALID",
            message: "Invalid extension token format.",
          },
        },
        { status: 401, headers: getCorsHeaders(request) }
      );
    }

    const supabase = await createClient();
    const tokenResult = await verifyExtensionToken(supabase, token);

    if (!tokenResult.valid) {
      const errorMessages: Record<string, string> = {
        EXTENSION_TOKEN_NOT_FOUND: "Extension token not found. Please reconnect the extension.",
        EXTENSION_TOKEN_REVOKED: "Extension token has been revoked. Please reconnect the extension.",
        EXTENSION_TOKEN_EXPIRED: "Extension token has expired. Please reconnect the extension.",
      };

      return NextResponse.json(
        {
          success: false,
          error: {
            code: tokenResult.errorCode || "EXTENSION_TOKEN_INVALID",
            message: errorMessages[tokenResult.errorCode || ""] || "Invalid or expired extension token. Please reconnect the extension.",
          },
        },
        { status: 401, headers: getCorsHeaders(request) }
      );
    }

    const userId = tokenResult.userId as string;

    const body = await request.json();
    const validation = validateExtensionImportRequest(body);

    if (!validation.valid || !validation.items) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: validation.error || "Invalid import request.",
          },
        },
        { status: 400, headers: getCorsHeaders(request) }
      );
    }

    const items = validation.items;
    const results: ImportResult[] = [];
    let archived = 0;
    let skipped = 0;
    let failed = 0;

    for (const item of items) {
      const existing = await findExistingMediaItem(userId, item.postId, item.mediaIndex);

      if (existing) {
        skipped++;
        results.push({
          postId: item.postId,
          mediaIndex: item.mediaIndex,
          status: "skipped",
          itemId: existing.id,
          reason: "DUPLICATE",
        });
        continue;
      }

      let uploadResult;
      try {
        uploadResult = await uploadImageFromUrl(
          item.mediaUrl,
          userId,
          item.authorUsername,
          item.postId,
          item.mediaIndex
        );
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        failed++;
        results.push({
          postId: item.postId,
          mediaIndex: item.mediaIndex,
          status: "failed",
          reason: "CLOUDINARY_UPLOAD_FAILED",
        });
        continue;
      }

      const newItem = await createMediaItem({
        userId: userId,
        postId: item.postId,
        authorUsername: item.authorUsername,
        sourcePostUrl: item.postUrl,
        caption: item.caption,
        mediaType: "image",
        mediaIndex: item.mediaIndex,
        originalMediaUrl: item.mediaUrl,
        cloudinaryPublicId: uploadResult.publicId,
        cloudinarySecureUrl: uploadResult.secureUrl,
        bytes: uploadResult.bytes,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        publishedAt: null,
      });

      if (!newItem) {
        try {
          await deleteImage(uploadResult.publicId);
        } catch {
          console.error("Failed to rollback Cloudinary upload:", uploadResult.publicId);
        }
        failed++;
        results.push({
          postId: item.postId,
          mediaIndex: item.mediaIndex,
          status: "failed",
          reason: "DATABASE_INSERT_FAILED",
        });
        continue;
      }

      archived++;
      results.push({
        postId: item.postId,
        mediaIndex: item.mediaIndex,
        status: "archived",
        itemId: newItem.id,
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          summary: {
            requested: items.length,
            archived,
            skipped,
            failed,
          },
          results,
        },
      },
      { status: 200, headers: getCorsHeaders(request) }
    );
  } catch (error) {
    console.error("Import error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred during import.",
        },
      },
      { status: 500, headers: getCorsHeaders(request) }
    );
  }
}
