import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createHash } from "crypto";

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

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function verifyExtensionToken(
  supabase: Awaited<ReturnType<typeof createClient>>,
  token: string
): Promise<{ valid: boolean; errorCode?: string; userId?: string }> {
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

    const authHeader = request.headers.get("Authorization");
    let extensionTokenValid = false;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      if (token && token.length >= 10) {
        const tokenResult = await verifyExtensionToken(supabase, token);

        if (!tokenResult.valid) {
          return NextResponse.json(
            {
              authenticated: false,
              extensionTokenValid: false,
              extensionTokenError: tokenResult.errorCode,
              user: { email: user.email },
            },
            {
              status: 200,
              headers: getCorsHeaders(request),
            }
          );
        }

        if (tokenResult.userId !== user.id) {
          return NextResponse.json(
            {
              authenticated: false,
              extensionTokenValid: false,
              extensionTokenError: "EXTENSION_TOKEN_USER_MISMATCH",
              user: { email: user.email },
            },
            {
              status: 200,
              headers: getCorsHeaders(request),
            }
          );
        }

        extensionTokenValid = true;
      }
    }

    return NextResponse.json(
      {
        authenticated: true,
        extensionTokenValid: extensionTokenValid || undefined,
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
