"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

type ShoppingItem = {
  id: string;
  name: string;
  quantity: string | null;
  is_checked: boolean;
  added_by: string;
  checked_by: string | null;
};

export function ShoppingList({
  householdId,
  currentUserId,
  memberNames,
  initialItems,
}: {
  householdId: string;
  currentUserId: string;
  memberNames: Record<string, string>;
  initialItems: ShoppingItem[];
}) {
  const [items, setItems] = useState<ShoppingItem[]>(initialItems);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`shopping-${householdId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shopping_items",
          filter: `household_id=eq.${householdId}`,
        },
        (payload) => {
          setItems((current) => {
            if (payload.eventType === "INSERT") {
              const newItem = payload.new as ShoppingItem;
              if (current.some((i) => i.id === newItem.id)) return current;
              return [...current, newItem];
            }
            if (payload.eventType === "UPDATE") {
              const updated = payload.new as ShoppingItem;
              return current.map((i) => (i.id === updated.id ? updated : i));
            }
            if (payload.eventType === "DELETE") {
              const oldItem = payload.old as { id: string };
              return current.filter((i) => i.id !== oldItem.id);
            }
            return current;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdId]);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    const supabase = createClient();
    await supabase.from("shopping_items").insert({
      household_id: householdId,
      name: trimmed,
      quantity: quantity.trim() || null,
      added_by: currentUserId,
    });

    setName("");
    setQuantity("");
  }

  async function toggleItem(item: ShoppingItem) {
    const supabase = createClient();
    const checked = !item.is_checked;
    await supabase
      .from("shopping_items")
      .update({
        is_checked: checked,
        checked_by: checked ? currentUserId : null,
        checked_at: checked ? new Date().toISOString() : null,
      })
      .eq("id", item.id);
  }

  async function deleteItem(id: string) {
    const supabase = createClient();
    await supabase.from("shopping_items").delete().eq("id", id);
  }

  const pending = items.filter((i) => !i.is_checked);
  const checked = items.filter((i) => i.is_checked);

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={addItem} className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Leche"
          className="flex-1"
        />
        <Input
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="2L"
          className="w-20"
        />
        <Button type="submit" size="icon" aria-label="Añadir">
          <Plus className="size-4" />
        </Button>
      </form>

      <div className="flex flex-col gap-2">
        {pending.length === 0 && (
          <p className="text-sm text-muted-foreground">Nada pendiente por comprar.</p>
        )}
        {pending.map((item) => (
          <div key={item.id} className="flex items-center gap-2 text-sm">
            <Checkbox checked={item.is_checked} onCheckedChange={() => toggleItem(item)} />
            <span className="flex-1">
              {item.name}
              {item.quantity ? ` (${item.quantity})` : ""}
            </span>
            <span className="text-xs text-muted-foreground">
              {memberNames[item.added_by]}
            </span>
            <button
              type="button"
              onClick={() => deleteItem(item.id)}
              aria-label="Quitar"
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>

      {checked.length > 0 && (
        <div className="flex flex-col gap-2 border-t pt-3">
          <p className="text-xs text-muted-foreground">Comprado</p>
          {checked.map((item) => (
            <div key={item.id} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox checked={item.is_checked} onCheckedChange={() => toggleItem(item)} />
              <span className="flex-1 line-through">
                {item.name}
                {item.quantity ? ` (${item.quantity})` : ""}
              </span>
              <button
                type="button"
                onClick={() => deleteItem(item.id)}
                aria-label="Quitar"
                className="hover:text-destructive"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
