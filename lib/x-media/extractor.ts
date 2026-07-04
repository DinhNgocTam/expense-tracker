import { ExtractedXPost, ExtractedMedia } from "./types";
import { isValidXPostUrl, isAllowedMediaDomain } from "./validators";
import { extractPostId } from "./url";

export interface XPostExtractor {
  extract(postUrl: string): Promise<ExtractedXPost>;
}

const USER_AGENT = "Mozilla/5.0 (compatible; XMediaArchive/1.0; +https://github.com/example/x-media-archive)";
const REQUEST_TIMEOUT_MS = 10000;
const MAX_RESPONSE_SIZE = 5 * 1024 * 1024;

function buildOgSearchRegex(pattern: string): RegExp {
  return new RegExp(`<meta[^>]+property=["']${pattern}["'][^>]+content=["']([^"']+)["']`, "i");
}

function buildTwSearchRegex(pattern: string): RegExp {
  return new RegExp(`<meta[^>]+name=["']${pattern}["'][^>]+content=["']([^"']+)["']`, "i");
}

function extractMetaContent(html: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return decodeHtmlEntities(match[1].trim());
    }
  }
  return null;
}

function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&#x27;": "'",
    "&#x2F;": "/",
    "&#x2019;": "'",
    "&#x201C;": '"',
    "&#x201D;": '"',
    "&nbsp;": " ",
  };

  return text.replace(/&[^;]+;/g, (match) => entities[match] || match);
}

function extractImageDimensions(url: string): { width?: number; height?: number } {
  const dimensionMatch = url.match(/&width=(\d+)&height=(\d+)/);
  if (dimensionMatch) {
    return {
      width: parseInt(dimensionMatch[1], 10),
      height: parseInt(dimensionMatch[2], 10),
    };
  }
  return {};
}

function extractImagesFromOgTags(html: string): ExtractedMedia[] {
  const media: ExtractedMedia[] = [];

  const imagePatterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/gi,
  ];

  const seenUrls = new Set<string>();
  let index = 0;

  for (const pattern of imagePatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null && index < 20) {
      const url = match[1];
      if (url && !seenUrls.has(url)) {
        try {
          const parsed = new URL(url);
          if (isAllowedMediaDomain(parsed.hostname)) {
            seenUrls.add(url);
            const dims = extractImageDimensions(url);
            media.push({
              index,
              type: "image",
              url,
              previewUrl: url,
              ...dims,
            });
            index++;
          }
        } catch {
          // skip invalid URLs
        }
      }
    }
  }

  const twitterImagePattern = /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/gi;
  let twitterMatch;
  while ((twitterMatch = twitterImagePattern.exec(html)) !== null && index < 20) {
    const url = twitterMatch[1];
    if (url && !seenUrls.has(url)) {
      try {
        const parsed = new URL(url);
        if (isAllowedMediaDomain(parsed.hostname)) {
          seenUrls.add(url);
          const dims = extractImageDimensions(url);
          media.push({
            index,
            type: "image",
            url,
            previewUrl: url,
            ...dims,
          });
          index++;
        }
      } catch {
        // skip invalid URLs
      }
    }
  }

  return media;
}

export class PublicXPostExtractor implements XPostExtractor {
  async extract(postUrl: string): Promise<ExtractedXPost> {
    if (!isValidXPostUrl(postUrl)) {
      throw new Error("INVALID_X_URL");
    }

    const postId = extractPostId(postUrl);
    if (!postId) {
      throw new Error("INVALID_X_URL");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(postUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": USER_AGENT,
          "Accept": "text/html,application/xhtml+xml,application/xml",
        },
        redirect: "follow",
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("EXTRACTION_TIMEOUT");
      }
      throw new Error("EXTRACTION_FAILED");
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error("EXTRACTION_FAILED");
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_SIZE) {
      throw new Error("RESPONSE_TOO_LARGE");
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      throw new Error("INVALID_CONTENT_TYPE");
    }

    const html = await response.text();

    if (html.length > MAX_RESPONSE_SIZE) {
      throw new Error("RESPONSE_TOO_LARGE");
    }

    const authorUsername = extractMetaContent(html, [
      buildTwSearchRegex("twitter:creator"),
      buildOgSearchRegex("og:title"),
    ]);

    let author: string | null = null;
    if (authorUsername) {
      const atMatch = authorUsername.match(/@([\w_]+)/);
      if (atMatch && atMatch[1]) {
        author = atMatch[1];
      } else if (/^[\w_]+$/.test(authorUsername)) {
        author = authorUsername;
      }
    }

    const caption = extractMetaContent(html, [
      buildOgSearchRegex("og:description"),
      buildTwSearchRegex("twitter:description"),
    ]);

    const publishedAt = extractMetaContent(html, [
      buildOgSearchRegex("article:published_time"),
      buildTwSearchRegex("twitter:created_at"),
    ]);

    const media = extractImagesFromOgTags(html);

    if (media.length === 0) {
      throw new Error("NO_MEDIA_FOUND");
    }

    return {
      postId,
      authorUsername: author,
      caption,
      sourcePostUrl: postUrl,
      publishedAt,
      media,
    };
  }
}

export function createExtractor(): XPostExtractor {
  return new PublicXPostExtractor();
}
