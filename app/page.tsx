import { Suspense } from "react";
import { addExpense, getExpenses } from "./actions";
import { calculateTotal, getDateRange, DateFilter } from "@/lib/utils";
import ExpenseList from "./components/ExpenseList";
import ExpenseFilter from "./components/ExpenseFilter";

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

function getEmptyMessage(filter: DateFilter): string {
  switch (filter) {
    case "this_month":
      return "Chưa có khoản chi nào trong tháng này.";
    case "last_month":
      return "Chưa có khoản chi nào trong tháng trước.";
    case "this_year":
      return "Chưa có khoản chi nào trong năm nay.";
    case "all":
      return "Chưa có khoản chi nào.";
    default:
      return "Chưa có khoản chi nào.";
  }
}

async function ExpenseContent({ filter }: { filter: DateFilter }) {
  const { startDate, endDate } = getDateRange(filter);
  const expenses = await getExpenses(startDate, endDate);
  const total = calculateTotal(expenses);
  const filterLabel = getFilterLabel(filter);
  const emptyMessage = getEmptyMessage(filter);

  return (
    <>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{filterLabel}</h2>
        <div className="text-lg font-bold bg-blue-100 text-blue-800 px-4 py-1 rounded-full">
          Tổng: {total.toLocaleString("vi-VN")} ₫
        </div>
      </div>

      <ExpenseFilter currentFilter={filter} />

      <ExpenseList expenses={expenses} addExpenseAction={addExpense} emptyMessage={emptyMessage} />
    </>
  );
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const filterParam = params.filter as DateFilter | undefined;
  const validFilters: DateFilter[] = ["this_month", "last_month", "this_year", "all"];
  const filter = filterParam && validFilters.includes(filterParam) ? filterParam : "this_month";

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-black">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center">
          Quản lý Chi tiêu Hàng ngày
        </h1>

        <Suspense fallback={<div className="text-center py-4">Đang tải...</div>}>
          <ExpenseContent filter={filter} />
        </Suspense>
      </div>
    </main>
  );
}
