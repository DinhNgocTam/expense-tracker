"use client";

import { useState, useMemo, useCallback } from "react";
import type { XMediaItem } from "@/lib/x-media/types";

interface ArchivedMediaGalleryProps {
  initialItems: XMediaItem[];
  total: number;
  onDelete: (id: string) => Promise<void>;
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
  isLoading: boolean;
}

export default function ArchivedMediaGallery({
  initialItems,
  total,
  onDelete,
  onLoadMore,
  hasMore,
  isLoading,
}: ArchivedMediaGalleryProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const items = useMemo(() => initialItems, [initialItems]);

  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id);
    setShowDeleteConfirm(null);
    setDeleteError(null);
    try {
      await onDelete(id);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  }, [onDelete]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Bộ sưu tập đã lưu</h2>
        <span className="text-sm text-gray-500">{total} hình ảnh</span>
      </div>

      {deleteError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {deleteError}
          <button
            onClick={() => setDeleteError(null)}
            className="ml-2 underline hover:no-underline"
          >
            Đóng
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Chưa có hình ảnh nào được lưu.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="group relative bg-gray-50 rounded-lg overflow-hidden border border-gray-200"
              >
                <div className="aspect-square">
                  <img
                    src={item.cloudinary_secure_url}
                    alt={`Image from @${item.author_username || "unknown"}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  <a
                    href={item.cloudinary_secure_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white text-gray-800 font-medium py-1 px-3 rounded-md text-sm hover:bg-gray-100"
                  >
                    Mở
                  </a>
                  <a
                    href={item.source_post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 text-white font-medium py-1 px-3 rounded-md text-sm hover:bg-blue-700"
                  >
                    Xem gốc
                  </a>
                  <button
                    onClick={() => setShowDeleteConfirm(item.id)}
                    disabled={deletingId === item.id}
                    className="bg-red-600 text-white font-medium py-1 px-3 rounded-md text-sm hover:bg-red-700 disabled:opacity-50"
                  >
                    {deletingId === item.id ? "Đang xóa..." : "Xóa"}
                  </button>
                </div>

                {showDeleteConfirm === item.id && (
                  <div className="absolute inset-0 bg-white flex flex-col items-center justify-center p-4 gap-3">
                    <p className="text-sm text-gray-700 text-center">Xóa hình ảnh này?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="bg-red-600 text-white font-medium py-1 px-3 rounded-md text-sm hover:bg-red-700"
                      >
                        Xóa
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="bg-gray-200 text-gray-700 font-medium py-1 px-3 rounded-md text-sm hover:bg-gray-300"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}

                <div className="p-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    @{item.author_username || "unknown"}
                  </p>
                  <p className="text-xs text-gray-400">{formatDate(item.created_at)}</p>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="mt-6 text-center">
              <button
                onClick={onLoadMore}
                disabled={isLoading}
                className="bg-gray-100 text-gray-700 font-medium py-2 px-6 rounded-md hover:bg-gray-200 transition disabled:opacity-50"
              >
                {isLoading ? "Đang tải..." : "Tải thêm"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
