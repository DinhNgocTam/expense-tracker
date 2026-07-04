"use client";

interface XPostUrlFormProps {
  onSubmit: (url: string) => Promise<void>;
  isLoading: boolean;
  error?: string;
}

export default function XPostUrlForm({ onSubmit, isLoading, error }: XPostUrlFormProps) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const url = formData.get("postUrl") as string;
    if (url) {
      await onSubmit(url.trim());
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold mb-4">Trích xuất hình ảnh từ X Post</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="postUrl" className="block text-sm font-medium text-gray-700 mb-1">
            URL X Post
          </label>
          <input
            type="url"
            id="postUrl"
            name="postUrl"
            required
            placeholder="https://x.com/username/status/123456789"
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Đang trích xuất..." : "Trích xuất hình ảnh"}
        </button>
      </form>
    </div>
  );
}
