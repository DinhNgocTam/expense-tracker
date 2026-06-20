'use client';

export default function ExpenseForm({ action }: { action?: (formData: FormData) => void }) {
  return (
    <form action={action} className="flex flex-col gap-4" data-testid="expense-form">
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
        <input 
          type="text" 
          id="description" 
          name="description" 
          required 
          className="w-full border rounded-md p-2"
          placeholder="e.g. Groceries" 
        />
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="amount" className="block text-sm font-medium mb-1">Amount ($)</label>
          <input 
            type="number" 
            id="amount" 
            name="amount" 
            step="0.01" 
            required 
            className="w-full border rounded-md p-2"
            placeholder="0.00" 
          />
        </div>
        <div className="flex-1">
          <label htmlFor="date" className="block text-sm font-medium mb-1">Date</label>
          <input 
            type="date" 
            id="date" 
            name="date"
            defaultValue={new Date().toISOString().split('T')[0]}
            className="w-full border rounded-md p-2" 
          />
        </div>
      </div>
      <button 
        type="submit" 
        className="mt-2 bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700 transition"
      >
        Add Expense
      </button>
    </form>
  );
}