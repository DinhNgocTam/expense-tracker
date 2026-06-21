"use client";

export interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
}

export interface ExpenseFormProps {
  action?: (formData: FormData) => void;
  initialValues?: Expense;
  onCancel?: () => void;
}

export default function ExpenseForm({
  action,
  initialValues,
  onCancel,
}: ExpenseFormProps) {
  const isEdit = !!initialValues;

  return (
    <form action={action} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="description" className="text-[14px] leading-[20px] tracking-[0.01em] font-semibold text-secondary ml-1">
          Mô tả
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
            edit
          </span>
          <input
            type="text"
            id="description"
            name="description"
            required
            defaultValue={initialValues?.description}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none bg-surface-bright"
            placeholder="vd: Mua thức ăn"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="amount" className="text-[14px] leading-[20px] tracking-[0.01em] font-semibold text-secondary ml-1">
            Số tiền (VNĐ)
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
              payments
            </span>
            <input
              type="number"
              id="amount"
              name="amount"
              step="0.01"
              required
              defaultValue={initialValues?.amount}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none bg-surface-bright text-right"
              placeholder="0"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="date" className="text-[14px] leading-[20px] tracking-[0.01em] font-semibold text-secondary ml-1">
            Ngày
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
              calendar_month
            </span>
            <input
              type="date"
              id="date"
              name="date"
              defaultValue={initialValues?.date || new Date().toISOString().split("T")[0]}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none bg-surface-bright"
              suppressHydrationWarning
            />
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          type="submit"
          className="flex-1 bg-gradient-to-r from-primary to-primary-container text-on-primary py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:translate-y-[-1px] active:scale-95 transition-all duration-200"
        >
          {isEdit ? "Cập nhật" : "Thêm khoản chi"}
        </button>
        {isEdit && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 text-gray-700 font-semibold py-4 px-6 rounded-xl hover:bg-gray-400 transition"
          >
            Hủy
          </button>
        )}
      </div>
    </form>
  );
}
