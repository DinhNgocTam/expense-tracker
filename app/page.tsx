import { addExpense, getMonthlyExpenses } from './actions';
import { calculateTotal } from '@/lib/utils';
import ExpenseForm from './components/ExpenseForm';

export default async function Home() {
  const expenses = await getMonthlyExpenses();
  const total = calculateTotal(expenses);

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-black">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center">Daily Expense Tracker</h1>

        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">Add Expense</h2>
          <ExpenseForm action={addExpense} />
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Monthly Expenses</h2>
            <div className="text-lg font-bold bg-blue-100 text-blue-800 px-4 py-1 rounded-full">
              Total: ${total.toFixed(2)}
            </div>
          </div>
          
          <ul className="space-y-3">
            {expenses.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No expenses found for this month.</p>
            ) : (
              expenses.map((expense) => (
                <li key={expense.id} className="flex justify-between border-b border-gray-100 pb-2">
                  <div>
                    <p className="font-medium">{expense.description}</p>
                    <p className="text-sm text-gray-500">{expense.date}</p>
                  </div>
                  <p className="font-bold text-gray-700">${Number(expense.amount).toFixed(2)}</p>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </main>
  );
}
