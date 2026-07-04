import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createExtractor } from "@/lib/x-media/extractor";
import { generateExtractionToken } from "@/lib/x-media/extraction-token";
import { isValidXPostUrl } from "@/lib/x-media/validators";
import { normalizeXUrl } from "@/lib/x-media/url";
import type { ApiResponse, ExtractResponse } from "@/lib/x-media/types";

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<ExtractResponse>>> {
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
            message: "You must be logged in to extract X post media.",
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { postUrl } = body;

    if (!postUrl || typeof postUrl !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_X_URL",
            message: "Please provide a valid X post URL.",
          },
        },
        { status: 400 }
      );
    }

    const normalizedUrl = normalizeXUrl(postUrl);
    if (!normalizedUrl || !isValidXPostUrl(normalizedUrl)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_X_URL",
            message: "Please enter a valid public X post URL (e.g., https://x.com/username/status/123456789).",
          },
        },
        { status: 400 }
      );
    }

    const extractor = createExtractor();
    const extractedPost = await extractor.extract(normalizedUrl);

    const mediaUrls = extractedPost.media.map((m) => m.url);
    const extractionToken = generateExtractionToken(
      user.id,
      extractedPost.postId,
      extractedPost.authorUsername,
      extractedPost.sourcePostUrl,
      mediaUrls
    );

    return NextResponse.json({
      success: true,
      data: {
        post: extractedPost,
        extractionToken,
      },
    });
  } catch (error) {
    console.error("Extract error:", error);

    if (error instanceof Error) {
      switch (error.message) {
        case "INVALID_X_URL":
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "INVALID_X_URL",
                message: "Please enter a valid public X post URL.",
              },
            },
            { status: 400 }
          );
        case "NO_MEDIA_FOUND":
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "NO_MEDIA_FOUND",
                message: "Could not extract public images from this X post. The post may require login, may not contain images, or X may have changed its public page format.",
              },
            },
            { status: 422 }
          );
        case "EXTRACTION_TIMEOUT":
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "EXTRACTION_TIMEOUT",
                message: "The extraction request timed out. Please try again.",
              },
            },
            { status: 504 }
          );
        case "EXTRACTION_FAILED":
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "EXTRACTION_FAILED",
                message: "Failed to extract media from the X post. Please try again later.",
              },
            },
            { status: 502 }
          );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred during extraction.",
        },
      },
      { status: 500 }
    );
  }
}
