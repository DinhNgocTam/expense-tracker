import { createHmac, randomBytes } from "crypto";
import { ExtractionTokenPayload } from "./types";
import { validateExtractionTokenPayload } from "./validators";

const TOKEN_LIFETIME_MS = 10 * 60 * 1000;

function getSecret(): string {
  const secret = process.env.X_MEDIA_EXTRACTION_SECRET;
  if (!secret) {
    throw new Error("X_MEDIA_EXTRACTION_SECRET environment variable is not set");
  }
  return secret;
}

export function generateExtractionToken(
  userId: string,
  postId: string,
  authorUsername: string | null,
  sourcePostUrl: string,
  mediaUrls: string[]
): string {
  const secret = getSecret();
  const exp = Date.now() + TOKEN_LIFETIME_MS;

  const payload: ExtractionTokenPayload = {
    userId,
    postId,
    authorUsername,
    sourcePostUrl,
    mediaUrls,
    exp,
  };

  const payloadJson = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(payloadJson).toString("base64url");

  const signature = createHmac("sha256", secret)
    .update(payloadBase64)
    .digest("base64url");

  return `${payloadBase64}.${signature}`;
}

export function verifyExtractionToken(token: string): ExtractionTokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) {
      return null;
    }

    const [payloadBase64, signature] = parts;

    const secret = getSecret();
    const expectedSignature = createHmac("sha256", secret)
      .update(payloadBase64)
      .digest("base64url");

    if (signature !== expectedSignature) {
      return null;
    }

    const payloadJson = Buffer.from(payloadBase64, "base64url").toString("utf-8");
    const payload = JSON.parse(payloadJson);

    if (!validateExtractionTokenPayload(payload)) {
      return null;
    }

    if (payload.exp < Date.now()) {
      return null;
    }

    return payload as ExtractionTokenPayload;
  } catch {
    return null;
  }
}

export function generateShortId(length: number = 16): string {
  return randomBytes(length).toString("hex");
}
