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
    <form
      action={action}
      className="flex flex-col gap-4"
      data-testid="expense-form"
    >
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Mô tả
        </label>
        <input
          type="text"
          id="description"
          name="description"
          required
          defaultValue={initialValues?.description}
          className="w-full border rounded-md p-2"
          placeholder="vd: Mua thức ăn"
        />
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="amount" className="block text-sm font-medium mb-1">
            Số tiền (VNĐ)
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            step="0.01"
            required
            defaultValue={initialValues?.amount}
            className="w-full border rounded-md p-2"
            placeholder="0"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="date" className="block text-sm font-medium mb-1">
            Ngày
          </label>
          <input
            type="date"
            id="date"
            name="date"
            defaultValue={initialValues?.date || new Date().toISOString().split("T")[0]}
            className="w-full border rounded-md p-2"
            suppressHydrationWarning
          />
        </div>
      </div>
      <div className="flex gap-2 mt-2">
        <button
          type="submit"
          className="bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700 transition flex-1"
        >
          {isEdit ? "Cập nhật" : "Thêm khoản chi"}
        </button>
        {isEdit && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-md hover:bg-gray-400 transition"
          >
            Hủy
          </button>
        )}
      </div>
    </form>
  );
}
