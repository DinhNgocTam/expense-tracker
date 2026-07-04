import ExtensionConnectClient from "./ExtensionConnectClient";

export const metadata = {
  title: "Kết nối Extension - X Media Archive",
  description: "Kết nối X Media Collector extension với ứng dụng",
};

export default function ExtensionConnectPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8 text-black">
      <div className="max-w-md mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Kết nối Extension</h1>
          <p className="text-gray-600 mt-2">
            Kết nối X Media Collector với tài khoản của bạn
          </p>
        </div>

        <ExtensionConnectClient />
      </div>
    </main>
  );
}
