import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface UploadResult {
  publicId: string;
  secureUrl: string;
  bytes: number;
  width: number;
  height: number;
  format: string;
}

function sanitizeFolderSegment(segment: string): string {
  return segment
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_{2,}/g, "_")
    .substring(0, 50);
}

function sanitizeUsername(username: string | null | undefined): string {
  if (!username) return "unknown";
  return sanitizeFolderSegment(username);
}

export async function uploadImageFromUrl(
  imageUrl: string,
  userId: string,
  authorUsername: string | null,
  postId: string,
  mediaIndex: number
): Promise<UploadResult> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, "0");

  const folder = `x-media/${sanitizeFolderSegment(userId)}/${sanitizeUsername(authorUsername)}/${year}/${month}`;

  const publicId = `${postId}-${mediaIndex}`;

  const result = await cloudinary.uploader.upload(imageUrl, {
    resource_type: "image",
    folder,
    public_id: publicId,
    overwrite: false,
    unique_filename: false,
    use_filename: false,
    invalidate: true,
    timeout: 30000,
  });

  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    bytes: result.bytes,
    width: result.width,
    height: result.height,
    format: result.format,
  };
}

export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true,
    });
    return result.result === "ok";
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    return false;
  }
}

export async function getImageInfo(publicId: string): Promise<{
  exists: boolean;
  info?: { bytes: number; width: number; height: number; format: string };
}> {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: "image",
      timeout: 10000,
    });
    return {
      exists: true,
      info: {
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        format: result.format,
      },
    };
  } catch {
    return { exists: false };
  }
}

export { cloudinary };
