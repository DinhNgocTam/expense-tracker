import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ExpenseList from "../app/components/ExpenseList";

const mockExpenses = [
  { id: "1", amount: 100, description: "Mua thức ăn", date: "2026-06-01" },
  { id: "2", amount: 50.5, description: "Mua nước", date: "2026-06-02" },
];

const mockDeleteExpense = vi.fn().mockResolvedValue(undefined);
const mockUpdateExpense = vi.fn().mockResolvedValue(undefined);
const mockAddExpense = vi.fn().mockResolvedValue(undefined);

vi.mock("../app/actions", () => ({
  deleteExpense: (...args: unknown[]) => mockDeleteExpense(...args),
  updateExpense: (...args: unknown[]) => mockUpdateExpense(...args),
  addExpense: (...args: unknown[]) => mockAddExpense(...args),
}));

describe("ExpenseList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it("renders expense items with description, amount, and date", () => {
    render(<ExpenseList expenses={mockExpenses} addExpenseAction={mockAddExpense} />);

    expect(screen.getByText("Mua thức ăn")).toBeDefined();
    expect(screen.getByText("Mua nước")).toBeDefined();
    expect(screen.getByText("2026-06-01")).toBeDefined();
    expect(screen.getByText("2026-06-02")).toBeDefined();
  });

  it("renders Edit and Delete buttons for each expense item", () => {
    render(<ExpenseList expenses={mockExpenses} addExpenseAction={mockAddExpense} />);

    const editButtons = screen.getAllByTestId("edit-button");
    const deleteButtons = screen.getAllByTestId("delete-button");

    expect(editButtons).toHaveLength(2);
    expect(deleteButtons).toHaveLength(2);
  });

  it("shows update form when Edit button is clicked", () => {
    render(<ExpenseList expenses={mockExpenses} addExpenseAction={mockAddExpense} />);

    const editButton = screen.getAllByTestId("edit-button")[0];
    fireEvent.click(editButton);

    expect(screen.getByText("Cập nhật khoản chi")).toBeDefined();
    expect(screen.getByDisplayValue("Mua thức ăn")).toBeDefined();
  });

  it("calls deleteExpense when Delete button is clicked and confirmed", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<ExpenseList expenses={mockExpenses} addExpenseAction={mockAddExpense} />);

    const deleteButton = screen.getAllByTestId("delete-button")[0];
    fireEvent.click(deleteButton);

    expect(mockDeleteExpense).toHaveBeenCalledWith("1");
    confirmSpy.mockRestore();
  });

  it("does not call deleteExpense when confirmation is cancelled", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    render(<ExpenseList expenses={mockExpenses} addExpenseAction={mockAddExpense} />);

    const deleteButton = screen.getAllByTestId("delete-button")[0];
    fireEvent.click(deleteButton);

    expect(mockDeleteExpense).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it("shows add form when Cancel is clicked during edit", () => {
    render(<ExpenseList expenses={mockExpenses} addExpenseAction={mockAddExpense} />);

    const editButton = screen.getAllByTestId("edit-button")[0];
    fireEvent.click(editButton);

    const cancelButton = screen.getByRole("button", { name: /hủy/i });
    fireEvent.click(cancelButton);

    expect(screen.getByRole("button", { name: /thêm khoản chi/i })).toBeDefined();
  });
});
