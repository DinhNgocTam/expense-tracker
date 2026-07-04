import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomBytes, createHash } from "crypto";

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
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
  };
}

function generateConnectCode(): string {
  return randomBytes(6).toString("hex").toUpperCase();
}

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
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
            code: "UNAUTHENTICATED",
            message: "You must be logged in to generate a connection code.",
          },
        },
        {
          status: 401,
          headers: getCorsHeaders(request),
        }
      );
    }

    const connectCode = generateConnectCode();
    const codeHash = hashCode(connectCode);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const { error } = await supabase
      .from("extension_tokens")
      .insert({
        user_id: user.id,
        token_hash: codeHash,
        expires_at: expiresAt.toISOString(),
      });

    if (error) {
      console.error("Error storing connect code:", error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to generate connection code.",
          },
        },
        {
          status: 500,
          headers: getCorsHeaders(request),
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          code: connectCode,
          expiresIn: 300,
        },
      },
      {
        status: 200,
        headers: getCorsHeaders(request),
      }
    );
  } catch (error) {
    console.error("Connect error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred.",
        },
      },
      {
        status: 500,
        headers: getCorsHeaders(request),
      }
    );
  }
}
