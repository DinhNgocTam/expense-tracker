import { X_HOSTNAMES, ALLOWED_MEDIA_DOMAINS, type XHostname } from "./types";

export const STATUS_PATH_REGEX = /^\/[\w_]+\/status\/(\d+)(?:\/.*)?$/;
const MAX_URL_LENGTH = 2048;
const MAX_MEDIA_PER_POST = 20;

export function isValidXHostname(hostname: string): hostname is XHostname {
  return X_HOSTNAMES.includes(hostname as XHostname);
}

export function isValidXPostUrl(url: string): boolean {
  if (!url || typeof url !== "string") {
    return false;
  }

  if (url.length > MAX_URL_LENGTH) {
    return false;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:") {
    return false;
  }

  if (!isValidXHostname(parsed.hostname)) {
    return false;
  }

  if (!STATUS_PATH_REGEX.test(parsed.pathname)) {
    return false;
  }

  if (parsed.username || parsed.password) {
    return false;
  }

  return true;
}

export function isLocalhostOrIP(hostname: string): boolean {
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    /^10\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    hostname === "0.0.0.0"
  ) {
    return true;
  }
  return false;
}

export function isAllowedMediaDomain(domain: string): boolean {
  return ALLOWED_MEDIA_DOMAINS.some((allowed) => domain === allowed || domain.endsWith(`.${allowed}`));
}

export function validateMediaUrls(urls: string[]): boolean {
  for (const url of urls) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:") {
        return false;
      }
      if (!isAllowedMediaDomain(parsed.hostname)) {
        return false;
      }
    } catch {
      return false;
    }
  }
  return true;
}

export function validateExtractionTokenPayload(payload: unknown): payload is { userId: string; postId: string; authorUsername: string | null; sourcePostUrl: string; mediaUrls: string[]; exp: number } {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }

  const obj = payload as Record<string, unknown>;

  if (typeof obj.userId !== "string" || !obj.userId) {
    return false;
  }

  if (typeof obj.postId !== "string" || !obj.postId) {
    return false;
  }

  if (typeof obj.authorUsername !== "string" && obj.authorUsername !== null) {
    return false;
  }

  if (typeof obj.sourcePostUrl !== "string" || !obj.sourcePostUrl) {
    return false;
  }

  if (!Array.isArray(obj.mediaUrls)) {
    return false;
  }

  for (const url of obj.mediaUrls) {
    if (typeof url !== "string" || !url) {
      return false;
    }
  }

  if (typeof obj.exp !== "number" || obj.exp <= Date.now()) {
    return false;
  }

  return true;
}

export function validateArchiveRequest(request: { extractionToken?: string; selectedMedia?: unknown }): {
  valid: boolean;
  error?: string;
} {
  if (!request.extractionToken || typeof request.extractionToken !== "string") {
    return { valid: false, error: "Missing or invalid extraction token" };
  }

  if (!Array.isArray(request.selectedMedia) || request.selectedMedia.length === 0) {
    return { valid: false, error: "No media selected for archiving" };
  }

  if (request.selectedMedia.length > MAX_MEDIA_PER_POST) {
    return { valid: false, error: `Maximum ${MAX_MEDIA_PER_POST} images per archive request` };
  }

  for (const media of request.selectedMedia) {
    if (typeof media !== "object" || media === null) {
      return { valid: false, error: "Invalid media item format" };
    }
    const m = media as { index?: number; url?: string };
    if (typeof m.index !== "number" || m.index < 0) {
      return { valid: false, error: "Invalid media index" };
    }
    if (typeof m.url !== "string" || !m.url) {
      return { valid: false, error: "Invalid media URL" };
    }
  }

  return { valid: true };
}

export interface ExtensionImportItem {
  postId: string;
  postUrl: string;
  authorUsername: string | null;
  caption: string | null;
  mediaIndex: number;
  mediaType: "image";
  mediaUrl: string;
  altText: string | null;
}

export function isValidPostId(id: string): boolean {
  return /^\d+$/.test(id) && id.length > 0 && id.length <= 20;
}

export function isValidMediaIndex(index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < 20;
}

export function isValidMediaUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  if (url.length > MAX_URL_LENGTH) return false;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    if (parsed.hostname !== "pbs.twimg.com") return false;
    if (!parsed.pathname.startsWith("/media/")) return false;
    if (parsed.username || parsed.password) return false;
    return true;
  } catch {
    return false;
  }
}

export function normalizePostUrl(postUrl: string): { username: string | null; postId: string } | null {
  try {
    const parsed = new URL(postUrl);
    if (!isValidXHostname(parsed.hostname)) return null;

    const pathParts = parsed.pathname.split("/").filter(Boolean);
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (pathParts[i] === "status" && pathParts[i + 1]) {
        const potentialId = pathParts[i + 1];
        if (isValidPostId(potentialId)) {
          return {
            username: pathParts[i - 1] || null,
            postId: potentialId,
          };
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function validateExtensionImportRequest(request: unknown): {
  valid: boolean;
  error?: string;
  items?: ExtensionImportItem[];
} {
  if (typeof request !== "object" || request === null) {
    return { valid: false, error: "Invalid request body" };
  }

  const req = request as Record<string, unknown>;

  if (!Array.isArray(req.items)) {
    return { valid: false, error: "Missing or invalid items array" };
  }

  if (req.items.length === 0) {
    return { valid: false, error: "No items provided" };
  }

  if (req.items.length > 20) {
    return { valid: false, error: "Maximum 20 items per request" };
  }

  const validatedItems: ExtensionImportItem[] = [];

  for (let i = 0; i < req.items.length; i++) {
    const item = req.items[i];

    if (typeof item !== "object" || item === null) {
      return { valid: false, error: `Invalid item at index ${i}` };
    }

    const it = item as Record<string, unknown>;

    if (typeof it.postId !== "string" || !isValidPostId(it.postId)) {
      return { valid: false, error: `Invalid postId at index ${i}` };
    }

    if (typeof it.postUrl !== "string" || !isValidXPostUrl(it.postUrl)) {
      return { valid: false, error: `Invalid postUrl at index ${i}` };
    }

    if (typeof it.mediaIndex !== "number" || !isValidMediaIndex(it.mediaIndex)) {
      return { valid: false, error: `Invalid mediaIndex at index ${i}` };
    }

    if (typeof it.mediaUrl !== "string" || !isValidMediaUrl(it.mediaUrl)) {
      return { valid: false, error: `Invalid mediaUrl at index ${i}` };
    }

    if (it.mediaType !== "image") {
      return { valid: false, error: `Only image media is supported at index ${i}` };
    }

    const normalized = normalizePostUrl(it.postUrl);
    if (!normalized || normalized.postId !== it.postId) {
      return { valid: false, error: `postId does not match postUrl at index ${i}` };
    }

    if (it.caption !== null && it.caption !== undefined && typeof it.caption !== "string") {
      return { valid: false, error: `Invalid caption at index ${i}` };
    }

    if (it.altText !== null && it.altText !== undefined && typeof it.altText !== "string") {
      return { valid: false, error: `Invalid altText at index ${i}` };
    }

    validatedItems.push({
      postId: it.postId as string,
      postUrl: it.postUrl as string,
      authorUsername: normalized.username,
      caption: typeof it.caption === "string" ? it.caption.trim().substring(0, 500) : null,
      mediaIndex: it.mediaIndex as number,
      mediaType: "image",
      mediaUrl: it.mediaUrl as string,
      altText: typeof it.altText === "string" ? it.altText.trim().substring(0, 200) : null,
    });
  }

  return { valid: true, items: validatedItems };
}
