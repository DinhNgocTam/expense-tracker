"use client";

import { useState } from "react";
import type { ExtractedXPost } from "@/lib/x-media/types";

interface ExtractedMediaPreviewProps {
  post: ExtractedXPost;
  extractionToken: string;
  onArchive: (token: string, selectedMedia: Array<{ index: number; url: string }>) => Promise<void>;
  isArchiving: boolean;
  archiveError?: string;
  archiveSuccess?: boolean;
}

export default function ExtractedMediaPreview({
  post,
  extractionToken,
  onArchive,
  isArchiving,
  archiveError,
  archiveSuccess,
}: ExtractedMediaPreviewProps) {
  const [selectedMedia, setSelectedMedia] = useState<Set<number>>(
    new Set(post.media.map((m) => m.index))
  );

  const toggleMedia = (index: number) => {
    const newSelected = new Set(selectedMedia);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedMedia(newSelected);
  };

  const toggleAll = () => {
    if (selectedMedia.size === post.media.length) {
      setSelectedMedia(new Set());
    } else {
      setSelectedMedia(new Set(post.media.map((m) => m.index)));
    }
  };

  const handleArchive = () => {
    const selected = post.media
      .filter((m) => selectedMedia.has(m.index))
      .map((m) => ({ index: m.index, url: m.url }));
    onArchive(extractionToken, selected);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Kết quả trích xuất</h2>

        <div className="text-sm text-gray-600 space-y-1">
          {post.authorUsername && (
            <p>
              <span className="font-medium">Tác giả:</span> @{post.authorUsername}
            </p>
          )}
          {post.caption && (
            <p className="line-clamp-2">
              <span className="font-medium">Nội dung:</span> {post.caption}
            </p>
          )}
          <p>
            <span className="font-medium">Nguồn:</span>{" "}
            <a
              href={post.sourcePostUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Xem bài viết gốc
            </a>
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedMedia.size === post.media.length}
              onChange={toggleAll}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Chọn tất cả ({selectedMedia.size}/{post.media.length})
            </span>
          </label>
        </div>

        <button
          onClick={handleArchive}
          disabled={isArchiving || selectedMedia.size === 0}
          className="bg-green-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isArchiving ? "Đang lưu..." : `Lưu ${selectedMedia.size} hình ảnh`}
        </button>
      </div>

      {archiveError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{archiveError}</p>
        </div>
      )}

      {archiveSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">Lưu thành công! Hình ảnh đã được thêm vào bộ sưu tập.</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {post.media.map((media) => (
          <div
            key={media.index}
            className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-colors ${
              selectedMedia.has(media.index)
                ? "border-blue-500 ring-2 ring-blue-200"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => toggleMedia(media.index)}
          >
            <img
              src={media.previewUrl || media.url}
              alt={`Image ${media.index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {selectedMedia.has(media.index) && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
            {media.width && media.height && (
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {media.width}x{media.height}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
