"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 bg-background/80 backdrop-blur-md z-40">
      <div className="flex justify-between items-center w-full px-[2.5rem] py-[1rem] max-w-[1280px] mx-auto">
        <h1 className="text-[24px] leading-[32px] font-semibold text-primary">
          Quản lý Chi tiêu Hàng ngày
        </h1>
        <div className="flex items-center gap-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-outline-variant hover:bg-error-container hover:border-error transition-all cursor-pointer active:scale-95"
          >
            <span className="text-[14px] leading-[20px] tracking-[0.01em] font-semibold text-secondary hover:text-error">
              Đăng xuất
            </span>
            <span className="material-symbols-outlined text-secondary hover:text-error">
              logout
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
