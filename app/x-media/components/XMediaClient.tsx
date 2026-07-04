"use client";

import { useState, useCallback } from "react";
import XPostUrlForm from "./XPostUrlForm";
import ExtractedMediaPreview from "./ExtractedMediaPreview";
import ArchivedMediaGallery from "./ArchivedMediaGallery";
import type { ExtractedXPost, XMediaItem } from "@/lib/x-media/types";

interface XMediaClientProps {
  initialItems: XMediaItem[];
  initialTotal: number;
}

export default function XMediaClient({ initialItems, initialTotal }: XMediaClientProps) {
  const [extractedPost, setExtractedPost] = useState<ExtractedXPost | null>(null);
  const [extractionToken, setExtractionToken] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | undefined>();

  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState<string | undefined>();
  const [archiveSuccess, setArchiveSuccess] = useState(false);

  const [galleryItems, setGalleryItems] = useState<XMediaItem[]>(initialItems);
  const [galleryTotal, setGalleryTotal] = useState(initialTotal);
  const [galleryPage, setGalleryPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleExtract = async (url: string) => {
    setIsExtracting(true);
    setExtractError(undefined);
    setExtractedPost(null);
    setExtractionToken(null);
    setArchiveSuccess(false);

    try {
      const response = await fetch("/api/x-media/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postUrl: url }),
      });

      const data = await response.json();

      if (!data.success) {
        setExtractError(data.error?.message || "Failed to extract media");
        return;
      }

      setExtractedPost(data.data.post);
      setExtractionToken(data.data.extractionToken);
    } catch {
      setExtractError("Network error. Please try again.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleArchive = async (
    token: string,
    selectedMedia: Array<{ index: number; url: string }>
  ) => {
    setIsArchiving(true);
    setArchiveError(undefined);
    setArchiveSuccess(false);

    try {
      const response = await fetch("/api/x-media/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extractionToken: token,
          selectedMedia,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setArchiveError(data.error?.message || "Failed to archive media");
        return;
      }

      setArchiveSuccess(true);
      setGalleryItems((prev) => [...data.data.items, ...prev]);
      setGalleryTotal((prev) => prev + data.data.archived);

      setExtractedPost(null);
      setExtractionToken(null);
    } catch {
      setArchiveError("Network error. Please try again.");
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDelete = useCallback(async (id: string) => {
    const response = await fetch(`/api/x-media/items/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      if (response.status === 404) {
        setGalleryItems((prev) => prev.filter((item) => item.id !== id));
        setGalleryTotal((prev) => Math.max(0, prev - 1));
        return;
      }
      const data = await response.json();
      throw new Error(data.error?.message || "Failed to delete");
    }

    setGalleryItems((prev) => prev.filter((item) => item.id !== id));
    setGalleryTotal((prev) => Math.max(0, prev - 1));
  }, []);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    try {
      const nextPage = galleryPage + 1;
      const response = await fetch(`/api/x-media/items?page=${nextPage}&pageSize=20`);
      const data = await response.json();

      if (data.success) {
        setGalleryItems((prev) => [...prev, ...data.data.items]);
        setGalleryPage(nextPage);
      }
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="space-y-8">
      <XPostUrlForm onSubmit={handleExtract} isLoading={isExtracting} error={extractError} />

      {extractedPost && extractionToken && (
        <ExtractedMediaPreview
          post={extractedPost}
          extractionToken={extractionToken}
          onArchive={handleArchive}
          isArchiving={isArchiving}
          archiveError={archiveError}
          archiveSuccess={archiveSuccess}
        />
      )}

      <ArchivedMediaGallery
        initialItems={galleryItems}
        total={galleryTotal}
        onDelete={handleDelete}
        onLoadMore={handleLoadMore}
        hasMore={galleryItems.length < galleryTotal}
        isLoading={isLoadingMore}
      />
    </div>
  );
}
