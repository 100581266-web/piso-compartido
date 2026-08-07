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
