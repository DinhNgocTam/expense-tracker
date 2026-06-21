"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { DateFilter } from "@/lib/utils";

const FILTER_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: "this_month", label: "Tháng này" },
  { value: "last_month", label: "Tháng trước" },
  { value: "this_year", label: "Năm nay" },
  { value: "all", label: "Tất cả" },
];

interface ExpenseFilterProps {
  currentFilter: DateFilter;
}

export default function ExpenseFilter({ currentFilter }: ExpenseFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleFilterChange = (newFilter: DateFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("filter", newFilter);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-4">
      <label className="text-[14px] leading-[20px] tracking-[0.01em] font-semibold text-secondary">
        Lọc theo:
      </label>
      <div className="inline-flex p-1 bg-surface-container-high rounded-full w-fit">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleFilterChange(option.value)}
            className={`px-6 py-2 rounded-full text-[14px] leading-[20px] tracking-[0.01em] font-bold transition-all ${
              currentFilter === option.value
                ? "bg-primary text-on-primary shadow-md"
                : "text-secondary hover:text-primary"
            }`}
            data-testid="filter-button"
            data-filter={option.value}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
