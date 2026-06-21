"use client";

import { useState } from "react";
import { deleteExpense, updateExpense } from "../actions";
import ExpenseForm, { Expense } from "./ExpenseForm";

interface ExpenseListProps {
  expenses: Expense[];
  addExpenseAction: (formData: FormData) => void;
  emptyMessage?: string;
}

export default function ExpenseList({
  expenses,
  addExpenseAction,
  emptyMessage = "Chưa có khoản chi nào.",
}: ExpenseListProps) {
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
        <section className="lg:col-span-5 bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-slate-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-2 h-8 bg-primary rounded-full"></div>
            <h2 className="text-[24px] leading-[32px] font-semibold text-on-background">
              Cập nhật khoản chi
            </h2>
          </div>
          <ExpenseForm
            action={handleUpdate}
            initialValues={editingExpense}
            onCancel={handleCancelEdit}
          />
        </section>
      ) : (
        <section className="lg:col-span-5 bg-white p-8 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-slate-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-2 h-8 bg-primary rounded-full"></div>
            <h2 className="text-[24px] leading-[32px] font-semibold text-on-background">
              Thêm khoản chi mới
            </h2>
          </div>
          <ExpenseForm action={addExpenseAction} />
        </section>
      )}

      <section className="lg:col-span-7 space-y-4">
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-[24px] leading-[32px] font-semibold text-on-background">
            Giao dịch gần đây
          </h2>
          <span className="text-[14px] leading-[20px] tracking-[0.01em] font-semibold text-secondary">
            {expenses.length} giao dịch tìm thấy
          </span>
        </div>

        {expenses.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center opacity-40 border-2 border-dashed border-outline-variant rounded-2xl">
            <span className="material-symbols-outlined text-4xl mb-2">
              post_add
            </span>
            <p className="text-[14px] leading-[20px] tracking-[0.01em] font-semibold">
              {emptyMessage}
            </p>
          </div>
        ) : (
          expenses.map((expense) => (
            <div
              key={expense.id}
              className="bg-white p-5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-slate-100 flex items-center justify-between group hover:border-primary/20 hover:shadow-md transition-all"
              data-testid="expense-item"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                  <span className="material-symbols-outlined text-secondary group-hover:text-primary">
                    shopping_bag
                  </span>
                </div>
                <div>
                  <h4 className="text-[18px] leading-[28px] font-semibold text-on-background">
                    {expense.description}
                  </h4>
                  <p className="text-[12px] leading-[16px] text-outline">
                    {expense.date}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <span className="text-[18px] leading-[28px] font-bold text-primary">
                  {Number(expense.amount).toLocaleString("vi-VN")} đ
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingExpense(expense)}
                    className="p-2 text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                    title="Sửa"
                    data-testid="edit-button"
                  >
                    <span className="material-symbols-outlined text-xl">
                      edit
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(expense.id)}
                    className="p-2 text-outline hover:text-error hover:bg-error-container/30 rounded-lg transition-all"
                    title="Xóa"
                    data-testid="delete-button"
                  >
                    <span className="material-symbols-outlined text-xl">
                      delete
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </>
  );
}
