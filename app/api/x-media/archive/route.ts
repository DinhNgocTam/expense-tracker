import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyExtractionToken } from "@/lib/x-media/extraction-token";
import { uploadImageFromUrl, deleteImage } from "@/lib/cloudinary/server";
import { findExistingMediaItem, createMediaItem } from "@/lib/x-media/repository";
import { validateArchiveRequest } from "@/lib/x-media/validators";
import type { ApiResponse, ArchiveResponse, XMediaItem } from "@/lib/x-media/types";

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<ArchiveResponse>>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "You must be logged in to archive media.",
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { extractionToken, selectedMedia } = body;

    const validation = validateArchiveRequest({ extractionToken, selectedMedia });
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: validation.error || "Invalid archive request.",
          },
        },
        { status: 400 }
      );
    }

    const tokenPayload = verifyExtractionToken(extractionToken);
    if (!tokenPayload) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "The extraction token is invalid or has expired. Please extract the X post again.",
          },
        },
        { status: 400 }
      );
    }

    if (tokenPayload.userId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You cannot archive media from another user's extraction.",
          },
        },
        { status: 403 }
      );
    }

    const validMediaUrls = new Set(tokenPayload.mediaUrls);
    for (const media of selectedMedia) {
      if (!validMediaUrls.has(media.url)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_MEDIA_URL",
              message: "One or more media URLs are not valid for this extraction.",
            },
          },
          { status: 400 }
        );
      }
    }

    const archivedItems: XMediaItem[] = [];
    let archived = 0;
    let skipped = 0;

    for (const media of selectedMedia) {
      const existing = await findExistingMediaItem(user.id, tokenPayload.postId, media.index);

      if (existing) {
        skipped++;
        archivedItems.push(existing);
        continue;
      }

      let uploadResult;
      try {
        uploadResult = await uploadImageFromUrl(
          media.url,
          user.id,
          tokenPayload.authorUsername || null,
          tokenPayload.postId,
          media.index
        );
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "UPLOAD_FAILED",
              message: "Failed to upload one or more images to Cloudinary. Please try again.",
            },
          },
          { status: 502 }
        );
      }

      const newItem = await createMediaItem({
        userId: user.id,
        postId: tokenPayload.postId,
        authorUsername: tokenPayload.authorUsername || null,
        sourcePostUrl: tokenPayload.sourcePostUrl,
        caption: null,
        mediaType: "image",
        mediaIndex: media.index,
        originalMediaUrl: media.url,
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
          console.error("Failed to rollback Cloudinary upload for public_id:", uploadResult.publicId);
        }

        return NextResponse.json(
          {
            success: false,
            error: {
              code: "DATABASE_ERROR",
              message: "Failed to save media metadata to the database.",
            },
          },
          { status: 500 }
        );
      }

      archivedItems.push(newItem);
      archived++;
    }

    return NextResponse.json({
      success: true,
      data: {
        archived,
        skipped,
        items: archivedItems,
      },
    });
  } catch (error) {
    console.error("Archive error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred during archiving.",
        },
      },
      { status: 500 }
    );
  }
}
