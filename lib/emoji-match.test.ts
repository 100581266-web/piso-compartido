import { describe, expect, it } from "vitest";
import { choreEmoji, groceryEmoji } from "./emoji-match";

describe("choreEmoji", () => {
  it("matches common household tasks", () => {
    expect(choreEmoji("Sacar la basura")).toBe("🗑️");
    expect(choreEmoji("Limpiar la cocina")).toBe("🍳");
    expect(choreEmoji("Fregar los platos")).toBe("🍽️");
    expect(choreEmoji("Tender la ropa")).toBe("🧺");
  });

  it("is accent and case insensitive", () => {
    expect(choreEmoji("REGAR las plantas")).toBe("🪴");
    expect(choreEmoji("baño")).toBe("🚽");
  });

  it("falls back to a generic icon for unknown tasks", () => {
    expect(choreEmoji("Organizar el trastero")).toBe("🧹");
  });
});

describe("groceryEmoji", () => {
  it("matches common groceries", () => {
    expect(groceryEmoji("Leche")).toBe("🥛");
    expect(groceryEmoji("Galletas")).toBe("🍪");
    expect(groceryEmoji("Café")).toBe("☕");
  });

  it("is accent insensitive", () => {
    expect(groceryEmoji("platano")).toBe("🍌");
    expect(groceryEmoji("PLÁTANO")).toBe("🍌");
  });

  it("falls back to a shopping cart for unknown items", () => {
    expect(groceryEmoji("Bombillas")).toBe("🛒");
  });
});
