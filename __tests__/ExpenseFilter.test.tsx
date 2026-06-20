import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import ExpenseFilter from "../app/components/ExpenseFilter";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
}));

const mockPush = vi.fn();

describe("ExpenseFilter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({ push: mockPush });
    (usePathname as ReturnType<typeof vi.fn>).mockReturnValue("/");
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue(
      new URLSearchParams()
    );
  });

  it("renders the filter select with all options", () => {
    render(<ExpenseFilter currentFilter="this_month" />);

    const select = screen.getByTestId("filter-select");
    expect(select).toBeDefined();

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(4);
    expect(options[0].textContent).toBe("Tháng này");
    expect(options[1].textContent).toBe("Tháng trước");
    expect(options[2].textContent).toBe("Năm nay");
    expect(options[3].textContent).toBe("Tất cả");
  });

  it("renders with the correct current filter selected", () => {
    render(<ExpenseFilter currentFilter="last_month" />);

    const select = screen.getByTestId("filter-select") as HTMLSelectElement;
    expect(select.value).toBe("last_month");
  });

  it("calls router.push with correct URL when filter is changed", () => {
    render(<ExpenseFilter currentFilter="this_month" />);

    const select = screen.getByTestId("filter-select");
    fireEvent.change(select, { target: { value: "this_year" } });

    expect(mockPush).toHaveBeenCalledWith("/?filter=this_year");
  });

  it("preserves existing query params when changing filter", () => {
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue(
      new URLSearchParams("other=value")
    );

    render(<ExpenseFilter currentFilter="this_month" />);

    const select = screen.getByTestId("filter-select");
    fireEvent.change(select, { target: { value: "all" } });

    expect(mockPush).toHaveBeenCalledWith("/?other=value&filter=all");
  });
});
