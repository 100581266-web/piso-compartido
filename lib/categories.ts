import { Utensils, Zap, PartyPopper, Home, Bus, Package, type LucideIcon } from "lucide-react";

export const EXPENSE_CATEGORIES = [
  "comida",
  "suministros",
  "ocio",
  "hogar",
  "transporte",
  "otros",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  comida: "Comida",
  suministros: "Suministros",
  ocio: "Ocio",
  hogar: "Hogar",
  transporte: "Transporte",
  otros: "Otros",
};

export const CATEGORY_ICONS: Record<ExpenseCategory, LucideIcon> = {
  comida: Utensils,
  suministros: Zap,
  ocio: PartyPopper,
  hogar: Home,
  transporte: Bus,
  otros: Package,
};

/** Same categorical palette used in Stats' charts, so a category reads as
 * the same color everywhere in the app (and in the exported spreadsheet). */
export const CATEGORY_HEX: Record<ExpenseCategory, string> = {
  comida: "#2a78d6",
  suministros: "#eb6834",
  ocio: "#1baf7a",
  hogar: "#eda100",
  transporte: "#e87ba4",
  otros: "#008300",
};
