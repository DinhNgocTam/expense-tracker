"use client";

interface SidebarProps {
  onAddTransaction?: () => void;
}

export default function Sidebar({ onAddTransaction }: SidebarProps) {
  return (
    <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-surface-container-lowest border border-outline-variant p-[1rem] gap-[0.5rem] shadow-sm z-50">
      <div className="flex flex-col gap-1 mb-8 px-4">
        <span className="text-[24px] leading-[32px] font-semibold text-primary">
          Quản lý Chi tiêu
        </span>
        <span className="text-[14px] leading-[20px] tracking-[0.01em] font-semibold text-secondary opacity-70">
          Fintech Premium
        </span>
      </div>

      <nav className="flex-grow flex flex-col gap-2">
        <a
          className="flex items-center gap-3 px-4 py-3 bg-secondary-container text-on-secondary-container rounded-xl font-bold active:scale-98 duration-150"
          href="#"
        >
          <span className="material-symbols-outlined">receipt_long</span>
          <span className="text-[14px] leading-[20px] tracking-[0.01em] font-semibold">
            Giao dịch
          </span>
        </a>
      </nav>

      <div className="pt-4 border-t border-outline-variant mt-auto">
        <button
          onClick={onAddTransaction}
          className="w-full bg-primary text-on-primary py-3 rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all"
        >
          Thêm Giao dịch
        </button>
      </div>
    </aside>
  );
}
