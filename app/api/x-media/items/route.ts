import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMediaItems } from "@/lib/x-media/repository";
import type { ApiResponse, PaginatedItemsResponse } from "@/lib/x-media/types";

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<PaginatedItemsResponse>>> {
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
            message: "You must be logged in to view archived media.",
          },
        },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const pageParam = searchParams.get("page");
    const pageSizeParam = searchParams.get("pageSize");

    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : 20;

    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_PAGE",
            message: "Page must be a positive integer.",
          },
        },
        { status: 400 }
      );
    }

    if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_PAGE_SIZE",
            message: "Page size must be between 1 and 100.",
          },
        },
        { status: 400 }
      );
    }

    const result = await getMediaItems(user.id, page, pageSize);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get items error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while fetching media items.",
        },
      },
      { status: 500 }
    );
  }
}
