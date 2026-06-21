"use client";

export default function Header() {
  return (
    <header className="sticky top-0 bg-background/80 backdrop-blur-md z-40">
      <div className="flex justify-between items-center w-full px-[2.5rem] py-[1rem] max-w-[1280px] mx-auto">
        <h1 className="text-[24px] leading-[32px] font-semibold text-primary">
          Quản lý Chi tiêu Hàng ngày
        </h1>
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-surface-container-low transition-colors cursor-pointer active:scale-95 duration-200">
            <span className="material-symbols-outlined text-primary">
              notifications
            </span>
          </button>
          <button className="flex items-center gap-2 p-1 pl-3 rounded-full border border-outline-variant hover:bg-surface-container-low transition-all cursor-pointer active:scale-95">
            <span className="text-[14px] leading-[20px] tracking-[0.01em] font-semibold">
              Admin
            </span>
            <span
              className="material-symbols-outlined text-primary"
              style={{ fontVariationSettings: '"FILL" 1' }}
            >
              account_circle
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
