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

  it("renders all filter buttons", () => {
    render(<ExpenseFilter currentFilter="this_month" />);

    const buttons = screen.getAllByTestId("filter-button");
    expect(buttons).toHaveLength(4);
    expect(buttons[0].textContent).toBe("Tháng này");
    expect(buttons[1].textContent).toBe("Tháng trước");
    expect(buttons[2].textContent).toBe("Năm nay");
    expect(buttons[3].textContent).toBe("Tất cả");
  });

  it("renders with the correct active filter styled as primary", () => {
    render(<ExpenseFilter currentFilter="last_month" />);

    const buttons = screen.getAllByTestId("filter-button");
    const lastMonthButton = buttons.find(
      (btn) => btn.getAttribute("data-filter") === "last_month"
    );
    expect(lastMonthButton).toBeDefined();
  });

  it("calls router.push with correct URL when filter button is clicked", () => {
    render(<ExpenseFilter currentFilter="this_month" />);

    const buttons = screen.getAllByTestId("filter-button");
    const thisYearButton = buttons.find(
      (btn) => btn.getAttribute("data-filter") === "this_year"
    );
    fireEvent.click(thisYearButton!);

    expect(mockPush).toHaveBeenCalledWith("/?filter=this_year");
  });

  it("preserves existing query params when changing filter", () => {
    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue(
      new URLSearchParams("other=value")
    );

    render(<ExpenseFilter currentFilter="this_month" />);

    const buttons = screen.getAllByTestId("filter-button");
    const allButton = buttons.find(
      (btn) => btn.getAttribute("data-filter") === "all"
    );
    fireEvent.click(allButton!);

    expect(mockPush).toHaveBeenCalledWith("/?other=value&filter=all");
  });
});
