import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMediaItemById, deleteMediaItem } from "@/lib/x-media/repository";
import { deleteMediaAsset } from "@/lib/cloudinary/server";
import type { ApiResponse } from "@/lib/x-media/types";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ deleted: boolean }>>> {
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
            message: "You must be logged in to delete media.",
          },
        },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_ID",
            message: "Invalid media item ID.",
          },
        },
        { status: 400 }
      );
    }

    const mediaItem = await getMediaItemById(id);

    if (!mediaItem) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Media item not found.",
          },
        },
        { status: 404 }
      );
    }

    if (mediaItem.user_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You do not have permission to delete this media item.",
          },
        },
        { status: 403 }
      );
    }

    let cloudinaryDeleted = false;
    try {
      cloudinaryDeleted = await deleteMediaAsset(
        mediaItem.cloudinary_public_id,
        mediaItem.media_type
      );
    } catch (cloudinaryError) {
      console.error("Cloudinary delete warning:", cloudinaryError);
    }

    const dbDeleted = await deleteMediaItem(id, user.id);

    if (!dbDeleted) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DELETE_FAILED",
            message: "Failed to delete the media item from the database.",
          },
        },
        { status: 500 }
      );
    }

    if (!cloudinaryDeleted) {
      console.warn(
        `Database record deleted but Cloudinary asset ${mediaItem.cloudinary_public_id} may still exist. Manual cleanup may be required.`
      );
    }

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error("Delete item error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while deleting the media item.",
        },
      },
      { status: 500 }
    );
  }
}
