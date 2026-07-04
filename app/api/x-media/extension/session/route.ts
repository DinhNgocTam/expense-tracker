import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          authenticated: false,
        },
        {
          status: 200,
          headers: getCorsHeaders(request),
        }
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          email: user.email,
        },
      },
      {
        status: 200,
        headers: getCorsHeaders(request),
      }
    );
  } catch (error) {
    console.error("Session check error:", error);

    return NextResponse.json(
      {
        authenticated: false,
        error: "Failed to check session",
      },
      {
        status: 500,
        headers: getCorsHeaders(request),
      }
    );
  }
}
