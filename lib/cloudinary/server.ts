import { v2 as cloudinary } from "cloudinary";
import type { MediaType } from "@/lib/x-media/types";

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
  duration?: number;
  bitrate?: number;
}

export interface VideoUploadResult extends UploadResult {
  duration: number;
  bitrate?: number;
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

  const publicId = `${postId}-image-${mediaIndex}`;

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

export async function uploadVideoFromUrl(
  videoUrl: string,
  userId: string,
  authorUsername: string | null,
  postId: string,
  mediaIndex: number
): Promise<VideoUploadResult> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, "0");

  const folder = `x-media/${sanitizeFolderSegment(userId)}/${sanitizeUsername(authorUsername)}/${year}/${month}`;

  const publicId = `${postId}-video-${mediaIndex}`;

  const result = await cloudinary.uploader.upload(videoUrl, {
    resource_type: "video",
    folder,
    public_id: publicId,
    overwrite: false,
    unique_filename: false,
    use_filename: false,
    invalidate: true,
    timeout: 120000,
  });

  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    bytes: result.bytes,
    width: result.width,
    height: result.height,
    format: result.format,
    duration: result.duration || 0,
    bitrate: result.bitrate,
  };
}

export async function deleteMediaAsset(
  publicId: string,
  mediaType: MediaType
): Promise<boolean> {
  const resourceType = mediaType === "video" ? "video" : "image";
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });
    return result.result === "ok";
  } catch (error) {
    console.error(`Error deleting ${mediaType} from Cloudinary:`, error);
    return false;
  }
}

export async function deleteImage(publicId: string): Promise<boolean> {
  return deleteMediaAsset(publicId, "image");
}

export async function deleteVideo(publicId: string): Promise<boolean> {
  return deleteMediaAsset(publicId, "video");
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
