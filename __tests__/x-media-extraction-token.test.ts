import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

vi.mock("@/lib/x-media/validators", () => ({
  validateExtractionTokenPayload: vi.fn().mockReturnValue(true),
}));

describe("Extraction Token", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    process.env.X_MEDIA_EXTRACTION_SECRET = "test-secret-key-for-testing";
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should generate and verify a valid token", async () => {
    const { generateExtractionToken, verifyExtractionToken } = await import(
      "@/lib/x-media/extraction-token"
    );

    const token = generateExtractionToken(
      "user-123",
      "post-456",
      "testuser",
      "https://x.com/user/status/789",
      ["https://pbs.twimg.com/media/abc.jpg"]
    );

    const payload = verifyExtractionToken(token);

    expect(payload).not.toBeNull();
    expect(payload?.userId).toBe("user-123");
    expect(payload?.postId).toBe("post-456");
    expect(payload?.authorUsername).toBe("testuser");
    expect(payload?.sourcePostUrl).toBe("https://x.com/user/status/789");
    expect(payload?.mediaUrls).toEqual(["https://pbs.twimg.com/media/abc.jpg"]);
  });

  it("should reject tampered token", async () => {
    const { generateExtractionToken, verifyExtractionToken } = await import(
      "@/lib/x-media/extraction-token"
    );

    const token = generateExtractionToken(
      "user-123",
      "post-456",
      "testuser",
      "https://x.com/user/status/789",
      ["https://pbs.twimg.com/media/abc.jpg"]
    );

    const tamperedToken = token.slice(0, -5) + "xxxxx";
    const payload = verifyExtractionToken(tamperedToken);

    expect(payload).toBeNull();
  });

  it("should reject token without secret", async () => {
    delete process.env.X_MEDIA_EXTRACTION_SECRET;

    await expect(async () => {
      const { generateExtractionToken } = await import("@/lib/x-media/extraction-token");
      generateExtractionToken("user-123", "post-456", "testuser", "https://x.com/user/status/789", []);
    }).rejects.toThrow("X_MEDIA_EXTRACTION_SECRET environment variable is not set");
  });
});
