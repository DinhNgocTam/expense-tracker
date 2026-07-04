"use client";

import { useState } from "react";

export default function ExtensionConnectClient() {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generateCode() {
    setLoading(true);
    setError(null);
    setCode(null);
    setCopied(false);

    try {
      const response = await fetch("/api/x-media/extension/connect", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error?.message || "Failed to generate code");
        return;
      }

      setCode(data.data.code);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyCode() {
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Hướng dẫn</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-600 text-sm">
          <li>Đảm bảo bạn đã đăng nhập vào ứng dụng này</li>
          <li>Nhấn nút &quot;Tạo mã kết nối&quot; bên dưới</li>
          <li>Sao chép mã và dán vào extension X Media Collector</li>
          <li>Mã có hiệu lực trong 5 phút</li>
        </ol>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {code ? (
        <div className="space-y-4">
          <div className="p-4 bg-gray-100 rounded-lg text-center">
            <p className="text-sm text-gray-500 mb-2">Mã kết nối của bạn</p>
            <p className="text-2xl font-mono font-bold tracking-wider">{code}</p>
          </div>
          <button
            onClick={copyCode}
            className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition"
          >
            {copied ? "Đã sao chép!" : "Sao chép mã"}
          </button>
          <p className="text-xs text-gray-500 text-center">
            Dán mã này vào extension X Media Collector để kết nối
          </p>
        </div>
      ) : (
        <button
          onClick={generateCode}
          disabled={loading}
          className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Đang tạo..." : "Tạo mã kết nối"}
        </button>
      )}

      <div className="border-t pt-4">
        <a
          href="/x-media"
          className="text-sm text-blue-600 hover:underline"
        >
          Quay lại trang X Media Archive
        </a>
      </div>
    </div>
  );
}
