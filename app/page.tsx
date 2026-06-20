import { addExpense, getMonthlyExpenses } from "./actions";
import { calculateTotal } from "@/lib/utils";
import ExpenseList from "./components/ExpenseList";

export default async function Home() {
  const expenses = await getMonthlyExpenses();
  const total = calculateTotal(expenses);

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-black">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center">
          Quản lý Chi tiêu Hàng ngày
        </h1>

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Chi tiêu trong tháng</h2>
          <div className="text-lg font-bold bg-blue-100 text-blue-800 px-4 py-1 rounded-full">
            Tổng: {total.toLocaleString("vi-VN")} ₫
          </div>
        </div>

        <ExpenseList expenses={expenses} addExpenseAction={addExpense} />
      </div>
    </main>
  );
}
