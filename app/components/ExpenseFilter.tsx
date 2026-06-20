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
    <div className="flex items-center gap-4 mb-6">
      <label htmlFor="filter" className="text-sm font-medium text-gray-700">
        Lọc theo:
      </label>
      <select
        id="filter"
        value={currentFilter}
        onChange={(e) => handleFilterChange(e.target.value as DateFilter)}
        className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        data-testid="filter-select"
      >
        {FILTER_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
