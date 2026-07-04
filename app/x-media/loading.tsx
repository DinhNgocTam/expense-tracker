export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-50 p-8 text-black">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">X Media Archive</h1>
          <p className="text-gray-600 mt-2">Đang tải...</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </main>
  );
}
