import { requireHousehold } from "@/lib/household";
import { ThemeToggle } from "@/components/theme-toggle";
import { BottomNav } from "./bottom-nav";

export default async function HouseholdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { household } = await requireHousehold();

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur">
        <span className="font-semibold">{household.name}</span>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 flex-col pb-16">{children}</main>
      <BottomNav />
    </div>
  );
}
