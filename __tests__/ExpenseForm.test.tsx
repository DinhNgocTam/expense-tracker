import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ExpenseForm, { Expense } from "../app/components/ExpenseForm";

const mockAction = vi.fn();

const mockExpense: Expense = {
  id: "1",
  amount: 100,
  description: "Mua thức ăn",
  date: "2026-06-01",
};

describe("ExpenseForm", () => {
  it("renders all form inputs and the submit button", () => {
    render(<ExpenseForm action={mockAction} />);

    expect(screen.getByLabelText(/mô tả/i)).toBeDefined();
    expect(screen.getByLabelText(/số tiền/i)).toBeDefined();
    expect(screen.getByLabelText(/ngày/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /thêm khoản chi/i })).toBeDefined();
  });

  it("renders with pre-filled values when initialValues is provided", () => {
    render(<ExpenseForm action={mockAction} initialValues={mockExpense} />);

    expect(screen.getByDisplayValue("Mua thức ăn")).toBeDefined();
    expect(screen.getByDisplayValue("100")).toBeDefined();
    expect(screen.getByDisplayValue("2026-06-01")).toBeDefined();
  });

  it("shows 'Cập nhật' button text when in edit mode", () => {
    render(<ExpenseForm action={mockAction} initialValues={mockExpense} />);

    expect(screen.getByRole("button", { name: /cập nhật/i })).toBeDefined();
  });

  it("shows 'Thêm khoản chi' button text when not in edit mode", () => {
    render(<ExpenseForm action={mockAction} />);

    expect(screen.getByRole("button", { name: /thêm khoản chi/i })).toBeDefined();
  });

  it("renders cancel button when onCancel is provided", () => {
    const onCancel = vi.fn();

    render(
      <ExpenseForm
        action={mockAction}
        initialValues={mockExpense}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByRole("button", { name: /hủy/i })).toBeDefined();
  });

  it("calls onCancel when cancel button is clicked", () => {
    const onCancel = vi.fn();

    render(
      <ExpenseForm
        action={mockAction}
        initialValues={mockExpense}
        onCancel={onCancel}
      />,
    );

    const cancelButton = screen.getByRole("button", { name: /hủy/i });
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });
});
