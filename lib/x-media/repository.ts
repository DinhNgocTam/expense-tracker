import { createClient } from "@/lib/supabase/server";
import { XMediaItem, PaginatedItemsResponse, MediaType } from "./types";

export interface CreateMediaItemInput {
  userId: string;
  postId: string;
  authorUsername: string | null;
  sourcePostUrl: string;
  caption: string | null;
  mediaType: MediaType;
  mediaIndex: number;
  originalMediaUrl: string | null;
  cloudinaryPublicId: string;
  cloudinarySecureUrl: string;
  bytes?: number | null;
  width?: number | null;
  height?: number | null;
  format?: string | null;
  publishedAt?: string | null;
  durationSeconds?: number | null;
  thumbnailUrl?: string | null;
  bitrate?: number | null;
  contentType?: string | null;
}

export async function findExistingMediaItem(
  userId: string,
  postId: string,
  mediaIndex: number,
  mediaType: MediaType
): Promise<XMediaItem | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("x_media_items")
    .select("*")
    .eq("user_id", userId)
    .eq("post_id", postId)
    .eq("media_index", mediaIndex)
    .eq("media_type", mediaType)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error finding existing media item:", error.message);
    return null;
  }

  return data as XMediaItem | null;
}

export async function createMediaItem(input: CreateMediaItemInput): Promise<XMediaItem | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("x_media_items")
    .insert({
      user_id: input.userId,
      post_id: input.postId,
      author_username: input.authorUsername,
      source_post_url: input.sourcePostUrl,
      caption: input.caption,
      media_type: input.mediaType,
      media_index: input.mediaIndex,
      original_media_url: input.originalMediaUrl,
      cloudinary_public_id: input.cloudinaryPublicId,
      cloudinary_secure_url: input.cloudinarySecureUrl,
      bytes: input.bytes,
      width: input.width,
      height: input.height,
      format: input.format,
      published_at: input.publishedAt,
      duration_seconds: input.durationSeconds,
      thumbnail_url: input.thumbnailUrl,
      bitrate: input.bitrate,
      content_type: input.contentType,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating media item:", error.message);
    return null;
  }

  return data as XMediaItem;
}

export async function getMediaItems(
  userId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedItemsResponse> {
  const supabase = await createClient();
  const offset = (page - 1) * pageSize;

  const { data: items, error: itemsError, count } = await supabase
    .from("x_media_items")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (itemsError) {
    console.error("Error fetching media items:", itemsError.message);
    return {
      items: [],
      total: 0,
      page,
      pageSize,
      hasMore: false,
    };
  }

  const total = count || 0;
  const hasMore = offset + (items?.length || 0) < total;

  return {
    items: (items || []) as XMediaItem[],
    total,
    page,
    pageSize,
    hasMore,
  };
}

export async function getMediaItemById(id: string): Promise<XMediaItem | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("x_media_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("Error fetching media item:", error.message);
    return null;
  }

  return data as XMediaItem;
}

export async function deleteMediaItem(id: string, userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("x_media_items")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting media item:", error.message);
    return false;
  }

  return true;
}

export async function deleteAllMediaItemsByPostId(
  userId: string,
  postId: string
): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("x_media_items")
    .select("id, cloudinary_public_id")
    .eq("user_id", userId)
    .eq("post_id", postId);

  if (error) {
    console.error("Error fetching media items for deletion:", error.message);
    return [];
  }

  const ids = (data || []).map((item) => item.id as string);

  if (ids.length > 0) {
    const { error: deleteError } = await supabase
      .from("x_media_items")
      .delete()
      .eq("user_id", userId)
      .eq("post_id", postId);

    if (deleteError) {
      console.error("Error deleting media items:", deleteError.message);
      return [];
    }
  }

  return ids;
}
