"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: "Giao dịch", href: "/", icon: "receipt_long" },
  // { label: "Kho media X", href: "/x-media", icon: "images" },
];

interface SidebarProps {
  onAddTransaction?: () => void;
}

function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar({ onAddTransaction }: SidebarProps) {
  const pathname = usePathname();

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
        {navItems.map((item) => {
          const active = isActiveRoute(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                active
                  ? "bg-secondary-container text-on-secondary-container active:scale-98 duration-150"
                  : "text-on-background hover:bg-surface-container-high active:scale-98 duration-150"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-[14px] leading-[20px] tracking-[0.01em] font-semibold">
                {item.label}
              </span>
            </Link>
          );
        })}
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
