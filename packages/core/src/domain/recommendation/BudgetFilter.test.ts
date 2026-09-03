import { describe, expect, it } from "vitest";
import { filterWithinBudget } from "./BudgetFilter";

describe("filterWithinBudget", () => {
  it("keeps only products within the budget", () => {
    const items = [
      { id: "a", priceCents: 5000 },
      { id: "b", priceCents: 15000 },
    ];
    const result = filterWithinBudget(items, 10000);
    expect(result.map((i) => i.id)).toEqual(["a"]);
  });

  it("returns all items when no budget is given", () => {
    const items = [
      { id: "a", priceCents: 5000 },
      { id: "b", priceCents: 15000 },
    ];
    expect(filterWithinBudget(items, null)).toEqual(items);
  });

  it("never excludes a product with unknown price", () => {
    const items = [
      { id: "a", priceCents: null },
      { id: "b", priceCents: 15000 },
    ];
    const result = filterWithinBudget(items, 10000);
    expect(result.map((i) => i.id)).toEqual(["a"]);
  });

  it("falls back to the full list when the budget excludes every product", () => {
    const items = [
      { id: "a", priceCents: 20000 },
      { id: "b", priceCents: 30000 },
    ];
    const result = filterWithinBudget(items, 5000);
    expect(result).toEqual(items);
  });
});
