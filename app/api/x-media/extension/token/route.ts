import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomBytes, createHash } from "crypto";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  process.env.X_MEDIA_EXTENSION_ORIGIN,
].filter(Boolean);

const EXTENSION_TOKEN_EXPIRY_DAYS = 30;

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

function generateExtensionToken(): string {
  return randomBytes(32).toString("base64url");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string" || code.length !== 12) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CODE",
            message: "Invalid connection code format.",
          },
        },
        {
          status: 400,
          headers: getCorsHeaders(request),
        }
      );
    }

    const supabase = await createClient();
    const codeHash = hashToken(code);

    const { data: tokenRecord, error: fetchError } = await supabase
      .from("extension_tokens")
      .select("id, user_id, expires_at, revoked_at")
      .eq("token_hash", codeHash)
      .single();

    if (fetchError || !tokenRecord) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CODE",
            message: "Invalid or expired connection code.",
          },
        },
        {
          status: 400,
          headers: getCorsHeaders(request),
        }
      );
    }

    if (tokenRecord.revoked_at) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "REVOKED_CODE",
            message: "This connection code has been revoked.",
          },
        },
        {
          status: 400,
          headers: getCorsHeaders(request),
        }
      );
    }

    const expiresAt = new Date(tokenRecord.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "EXPIRED_CODE",
            message: "Connection code has expired.",
          },
        },
        {
          status: 400,
          headers: getCorsHeaders(request),
        }
      );
    }

    const extensionToken = generateExtensionToken();
    const tokenHash = hashToken(extensionToken);
    const tokenExpiresAt = new Date(
      Date.now() + EXTENSION_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    );

    const { error: deleteError } = await supabase
      .from("extension_tokens")
      .delete()
      .eq("id", tokenRecord.id);

    if (deleteError) {
      console.error("Error deleting used connect code:", deleteError);
    }

    const { error: insertError } = await supabase
      .from("extension_tokens")
      .insert({
        user_id: tokenRecord.user_id,
        token_hash: tokenHash,
        expires_at: tokenExpiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error storing extension token:", insertError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to generate extension token.",
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
          token: extensionToken,
          expiresIn: EXTENSION_TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
        },
      },
      {
        status: 200,
        headers: getCorsHeaders(request),
      }
    );
  } catch (error) {
    console.error("Token exchange error:", error);

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
