import { Suspense } from "react";
import { addExpense, getExpenses } from "./actions";
import { calculateTotal, getDateRange, DateFilter } from "@/lib/utils";
import ExpenseList from "./components/ExpenseList";
import ExpenseFilter from "./components/ExpenseFilter";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

interface HomeProps {
  searchParams: Promise<{ filter?: string }>;
}

function getFilterLabel(filter: DateFilter): string {
  switch (filter) {
    case "this_month":
      return "Chi tiêu trong tháng";
    case "last_month":
      return "Chi tiêu tháng trước";
    case "this_year":
      return "Chi tiêu trong năm";
    case "all":
      return "Tất cả chi tiêu";
    default:
      return "Chi tiêu trong tháng";
  }
}

async function ExpenseContent({ filter }: { filter: DateFilter }) {
  const { startDate, endDate } = getDateRange(filter);
  const expenses = await getExpenses(startDate, endDate);
  const total = calculateTotal(expenses);
  const filterLabel = getFilterLabel(filter);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-[1.5rem]">
        <div className="lg:col-span-7 flex flex-col gap-4">
          <ExpenseFilter currentFilter={filter} />
        </div>
        <div className="lg:col-span-5">
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[14px] leading-[20px] tracking-[0.01em] font-semibold text-secondary mb-1">
                {filterLabel}
              </p>
              <h3 className="text-[24px] leading-[32px] font-semibold text-primary">
                {total.toLocaleString("vi-VN")} đ
              </h3>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-secondary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-on-secondary-container text-3xl">
                account_balance_wallet
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-[1.5rem] items-start">
        <ExpenseList
          expenses={expenses}
          addExpenseAction={addExpense}
          emptyMessage="Chưa có khoản chi nào."
        />
      </div>
    </>
  );
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const filterParam = params.filter as DateFilter | undefined;
  const validFilters: DateFilter[] = ["this_month", "last_month", "this_year", "all"];
  const filter = filterParam && validFilters.includes(filterParam) ? filterParam : "this_month";

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-grow ml-0 md:ml-64 transition-all duration-300">
        <Header />

        <div className="px-[2.5rem] py-[2rem] max-w-[1280px] mx-auto space-y-[2rem]">
          <Suspense fallback={<div className="text-center py-4">Đang tải...</div>}>
            <ExpenseContent filter={filter} />
          </Suspense>
        </div>

        <footer className="py-[2rem]"></footer>
      </main>
    </div>
  );
}
