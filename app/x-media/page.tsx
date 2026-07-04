import { createClient } from "@/lib/supabase/server";
import { getMediaItems } from "@/lib/x-media/repository";
import Link from "next/link";
import XMediaClient from "./components/XMediaClient";

export const metadata = {
  title: "X Media Archive",
  description: "Archive images from public X posts",
};

export default async function XMediaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialItems: Awaited<ReturnType<typeof getMediaItems>>["items"] = [];
  let initialTotal = 0;

  if (user) {
    const result = await getMediaItems(user.id, 1, 20);
    initialItems = result.items;
    initialTotal = result.total;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-black">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">X Media Archive</h1>
          <p className="text-gray-600 mt-2">
            Trích xuất và lưu hình ảnh từ các bài viết công khai trên X
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-2">Kết nối Chrome Extension</h2>
          <p className="text-gray-600 text-sm mb-4">
            Tạo mã kết nối để liên kết X Media Collector với ứng dụng và lưu ảnh trực tiếp từ trình duyệt.
          </p>
          <Link
            href="/x-media/extension-connect"
            className="inline-block bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Kết nối Extension
          </Link>
        </div>

        <XMediaClient initialItems={initialItems} initialTotal={initialTotal} />
      </div>
    </main>
  );
}
