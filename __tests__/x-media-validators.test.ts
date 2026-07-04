import { describe, it, expect } from "vitest";
import {
  isValidXPostUrl,
  isLocalhostOrIP,
  isAllowedMediaDomain,
  validateMediaUrls,
  validateExtractionTokenPayload,
  validateArchiveRequest,
} from "../lib/x-media/validators";

describe("URL Validation", () => {
  describe("isValidXPostUrl", () => {
    it("should accept valid x.com URLs", () => {
      expect(isValidXPostUrl("https://x.com/username/status/123456789")).toBe(true);
      expect(isValidXPostUrl("https://www.x.com/username/status/123456789")).toBe(true);
    });

    it("should accept valid twitter.com URLs", () => {
      expect(isValidXPostUrl("https://twitter.com/username/status/123456789")).toBe(true);
      expect(isValidXPostUrl("https://www.twitter.com/username/status/123456789")).toBe(true);
    });

    it("should reject invalid hostnames", () => {
      expect(isValidXPostUrl("https://example.com/username/status/123456789")).toBe(false);
      expect(isValidXPostUrl("https://facebook.com/username/status/123456789")).toBe(false);
    });

    it("should reject non-HTTPS URLs", () => {
      expect(isValidXPostUrl("http://x.com/username/status/123456789")).toBe(false);
    });

    it("should reject malformed status URLs", () => {
      expect(isValidXPostUrl("https://x.com/username/")).toBe(false);
      expect(isValidXPostUrl("https://x.com/username/status/")).toBe(false);
      expect(isValidXPostUrl("https://x.com/username")).toBe(false);
    });

    it("should reject URLs with credentials", () => {
      expect(isValidXPostUrl("https://user:pass@x.com/username/status/123456789")).toBe(false);
    });

    it("should reject localhost URLs", () => {
      expect(isValidXPostUrl("https://localhost/username/status/123456789")).toBe(false);
    });

    it("should handle URL with extra path segments", () => {
      expect(isValidXPostUrl("https://x.com/username/status/123456789/photo/1")).toBe(true);
    });
  });

  describe("isLocalhostOrIP", () => {
    it("should detect localhost", () => {
      expect(isLocalhostOrIP("localhost")).toBe(true);
      expect(isLocalhostOrIP("127.0.0.1")).toBe(true);
      expect(isLocalhostOrIP("::1")).toBe(true);
    });

    it("should detect private IP ranges", () => {
      expect(isLocalhostOrIP("10.0.0.1")).toBe(true);
      expect(isLocalhostOrIP("172.16.0.1")).toBe(true);
      expect(isLocalhostOrIP("192.168.1.1")).toBe(true);
    });

    it("should accept public hostnames", () => {
      expect(isLocalhostOrIP("x.com")).toBe(false);
      expect(isLocalhostOrIP("twitter.com")).toBe(false);
    });
  });

  describe("isAllowedMediaDomain", () => {
    it("should accept twimg.com domains", () => {
      expect(isAllowedMediaDomain("pbs.twimg.com")).toBe(true);
      expect(isAllowedMediaDomain("ton.twimg.com")).toBe(true);
      expect(isAllowedMediaDomain("video.twimg.com")).toBe(true);
    });

    it("should reject other domains", () => {
      expect(isAllowedMediaDomain("example.com")).toBe(false);
      expect(isAllowedMediaDomain("x.com")).toBe(false);
    });
  });

  describe("validateMediaUrls", () => {
    it("should accept valid media URLs", () => {
      expect(
        validateMediaUrls(["https://pbs.twimg.com/media/abc.jpg"])
      ).toBe(true);
    });

    it("should reject URLs with invalid domains", () => {
      expect(
        validateMediaUrls(["https://example.com/media/abc.jpg"])
      ).toBe(false);
    });

    it("should reject non-HTTPS URLs", () => {
      expect(
        validateMediaUrls(["http://pbs.twimg.com/media/abc.jpg"])
      ).toBe(false);
    });
  });
});

describe("Extraction Token Validation", () => {
  describe("validateExtractionTokenPayload", () => {
    it("should accept valid payload", () => {
      const payload = {
        userId: "user-123",
        postId: "post-456",
        authorUsername: "testuser",
        sourcePostUrl: "https://x.com/user/status/123",
        mediaUrls: ["https://pbs.twimg.com/media/abc.jpg"],
        exp: Date.now() + 600000,
      };
      expect(validateExtractionTokenPayload(payload)).toBe(true);
    });

    it("should reject expired token", () => {
      const payload = {
        userId: "user-123",
        postId: "post-456",
        authorUsername: "testuser",
        sourcePostUrl: "https://x.com/user/status/123",
        mediaUrls: ["https://pbs.twimg.com/media/abc.jpg"],
        exp: Date.now() - 1000,
      };
      expect(validateExtractionTokenPayload(payload)).toBe(false);
    });

    it("should reject missing fields", () => {
      expect(
        validateExtractionTokenPayload({
          userId: "user-123",
          postId: "post-456",
        })
      ).toBe(false);
    });

    it("should reject null or undefined", () => {
      expect(validateExtractionTokenPayload(null)).toBe(false);
      expect(validateExtractionTokenPayload(undefined)).toBe(false);
    });
  });
});

describe("Archive Request Validation", () => {
  describe("validateArchiveRequest", () => {
    it("should accept valid archive request", () => {
      const request = {
        extractionToken: "valid-token",
        selectedMedia: [{ index: 0, url: "https://pbs.twimg.com/media/abc.jpg" }],
      };
      const result = validateArchiveRequest(request);
      expect(result.valid).toBe(true);
    });

    it("should reject missing extraction token", () => {
      const request = {
        selectedMedia: [{ index: 0, url: "https://pbs.twimg.com/media/abc.jpg" }],
      };
      const result = validateArchiveRequest(request);
      expect(result.valid).toBe(false);
    });

    it("should reject empty selected media", () => {
      const request = {
        extractionToken: "valid-token",
        selectedMedia: [],
      };
      const result = validateArchiveRequest(request);
      expect(result.valid).toBe(false);
    });

    it("should reject too many media items", () => {
      const selectedMedia = Array.from({ length: 21 }, (_, i) => ({
        index: i,
        url: "https://pbs.twimg.com/media/abc.jpg",
      }));
      const request = {
        extractionToken: "valid-token",
        selectedMedia,
      };
      const result = validateArchiveRequest(request);
      expect(result.valid).toBe(false);
    });
  });
});
