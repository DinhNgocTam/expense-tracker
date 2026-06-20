"use client";

import { useState } from "react";
import { deleteExpense, updateExpense } from "../actions";
import ExpenseForm, { Expense } from "./ExpenseForm";

interface ExpenseListProps {
  expenses: Expense[];
  addExpenseAction: (formData: FormData) => void;
  emptyMessage?: string;
}

export default function ExpenseList({ expenses, addExpenseAction, emptyMessage = "Chưa có khoản chi nào." }: ExpenseListProps) {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa khoản chi này?")) {
      await deleteExpense(id);
    }
  };

  const handleUpdate = async (formData: FormData) => {
    if (editingExpense) {
      await updateExpense(editingExpense.id, formData);
      setEditingExpense(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingExpense(null);
  };

  return (
    <>
      {editingExpense ? (
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">Cập nhật khoản chi</h2>
          <ExpenseForm
            action={handleUpdate}
            initialValues={editingExpense}
            onCancel={handleCancelEdit}
          />
        </section>
      ) : (
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">Thêm khoản chi</h2>
          <ExpenseForm action={addExpenseAction} />
        </section>
      )}

      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <ul className="space-y-3">
          {expenses.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              {emptyMessage}
            </p>
          ) : (
            expenses.map((expense) => (
              <li
                key={expense.id}
                className="flex justify-between items-center border-b border-gray-100 pb-2"
                data-testid="expense-item"
              >
                <div>
                  <p className="font-medium">{expense.description}</p>
                  <p className="text-sm text-gray-500">{expense.date}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-bold text-gray-700">
                    {Number(expense.amount).toLocaleString("vi-VN")} ₫
                  </p>
                  <button
                    type="button"
                    onClick={() => setEditingExpense(expense)}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    data-testid="edit-button"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(expense.id)}
                    className="text-red-600 hover:text-red-800 font-medium text-sm"
                    data-testid="delete-button"
                  >
                    Xóa
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
    </>
  );
}
