import { describe, it, expect } from "vitest";
import { extractPostId, normalizeXUrl } from "../lib/x-media/url";

describe("URL Utilities", () => {
  describe("extractPostId", () => {
    it("should extract post ID from x.com URL", () => {
      expect(extractPostId("https://x.com/username/status/123456789")).toBe("123456789");
    });

    it("should extract post ID from twitter.com URL", () => {
      expect(extractPostId("https://twitter.com/username/status/123456789")).toBe("123456789");
    });

    it("should extract post ID from URL with extra path segments", () => {
      expect(extractPostId("https://x.com/username/status/123456789/photo/1")).toBe("123456789");
    });

    it("should return null for invalid URLs", () => {
      expect(extractPostId("https://x.com/username/")).toBeNull();
      expect(extractPostId("https://x.com/username/status/")).toBeNull();
    });

    it("should return null for non-status URLs", () => {
      expect(extractPostId("https://x.com/username")).toBeNull();
    });
  });

  describe("normalizeXUrl", () => {
    it("should normalize twitter.com to x.com", () => {
      const result = normalizeXUrl("https://twitter.com/username/status/123456789");
      expect(result).toBe("https://x.com/username/status/123456789");
    });

    it("should preserve x.com URLs", () => {
      const result = normalizeXUrl("https://x.com/username/status/123456789");
      expect(result).toBe("https://x.com/username/status/123456789");
    });

    it("should remove query params and hash", () => {
      const result = normalizeXUrl("https://x.com/username/status/123456789?lang=en#top");
      expect(result).toBe("https://x.com/username/status/123456789");
    });

    it("should return null for invalid URLs", () => {
      expect(normalizeXUrl("https://example.com/username/status/123")).toBeNull();
    });

    it("should handle www prefix", () => {
      const result = normalizeXUrl("https://www.x.com/username/status/123456789");
      expect(result).toBe("https://x.com/username/status/123456789");
    });
  });
});
