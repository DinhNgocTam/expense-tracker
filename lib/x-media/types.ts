export type MediaType = "image" | "video";

export interface ExtractedMedia {
  index: number;
  type: MediaType;
  url: string;
  previewUrl?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  thumbnailUrl?: string;
  supported?: boolean;
  unsupportedReason?: string;
}

export interface ExtractedXPost {
  postId: string;
  authorUsername: string | null;
  caption: string | null;
  sourcePostUrl: string;
  publishedAt: string | null;
  media: ExtractedMedia[];
}

export interface XMediaItem {
  id: string;
  user_id: string;
  post_id: string;
  author_username: string | null;
  source_post_url: string;
  caption: string | null;
  media_type: MediaType;
  media_index: number;
  original_media_url: string | null;
  cloudinary_public_id: string;
  cloudinary_secure_url: string;
  bytes: number | null;
  width: number | null;
  height: number | null;
  format: string | null;
  published_at: string | null;
  created_at: string;
  duration_seconds: number | null;
  thumbnail_url: string | null;
  bitrate: number | null;
  content_type: string | null;
}

export interface ExtractionTokenPayload {
  userId: string;
  postId: string;
  authorUsername: string | null;
  sourcePostUrl: string;
  mediaUrls: string[];
  exp: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface ExtractRequest {
  postUrl: string;
}

export interface ExtractResponse {
  post: ExtractedXPost;
  extractionToken: string;
}

export interface ArchiveRequest {
  extractionToken: string;
  selectedMedia: Array<{
    index: number;
    url: string;
  }>;
}

export interface ArchiveResponse {
  archived: number;
  skipped: number;
  items: XMediaItem[];
}

export interface PaginatedItemsResponse {
  items: XMediaItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export const X_HOSTNAMES = ["x.com", "www.x.com", "twitter.com", "www.twitter.com"] as const;
export type XHostname = typeof X_HOSTNAMES[number];

export const ALLOWED_MEDIA_DOMAINS = ["pbs.twimg.com", "video.twimg.com", "ton.twimg.com"] as const;
