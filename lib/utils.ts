export function calculateTotal(expenses: { amount: number }[]): number {
  return expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
}