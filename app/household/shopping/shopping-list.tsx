"use client";

import { useEffect, useState } from "react";
import { Plus, Users, User, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type ShoppingItem = {
  id: string;
  name: string;
  quantity: string | null;
  is_checked: boolean;
  added_by: string;
  checked_by: string | null;
  owner_user_id: string | null;
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
  const [scope, setScope] = useState<"shared" | "personal">("shared");

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
      owner_user_id: scope === "personal" ? currentUserId : null,
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

  const shared = items.filter((i) => !i.owner_user_id);
  const mine = items.filter((i) => i.owner_user_id === currentUserId);
  const others = items.filter(
    (i) => i.owner_user_id && i.owner_user_id !== currentUserId
  );
  const othersByOwner = others.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
    const key = item.owner_user_id!;
    acc[key] = acc[key] ?? [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={addItem} className="flex flex-col gap-2">
        <div className="flex gap-2">
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
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={scope === "shared" ? "default" : "outline"}
            onClick={() => setScope("shared")}
            className="flex-1"
          >
            <Users className="size-4" />
            Compartido
          </Button>
          <Button
            type="button"
            size="sm"
            variant={scope === "personal" ? "default" : "outline"}
            onClick={() => setScope("personal")}
            className="flex-1"
          >
            <User className="size-4" />
            Solo para mí
          </Button>
        </div>
      </form>

      <ShoppingGroup
        title="Compartido"
        items={shared}
        editable
        onToggle={toggleItem}
        onDelete={deleteItem}
      />

      <ShoppingGroup
        title="Mi comida"
        items={mine}
        editable
        onToggle={toggleItem}
        onDelete={deleteItem}
      />

      {Object.entries(othersByOwner).map(([ownerId, ownerItems]) => (
        <ShoppingGroup
          key={ownerId}
          title={`Comida de ${memberNames[ownerId] ?? "—"}`}
          items={ownerItems}
          editable={false}
        />
      ))}
    </div>
  );
}

function ShoppingGroup({
  title,
  items,
  editable,
  onToggle,
  onDelete,
}: {
  title: string;
  items: ShoppingItem[];
  editable: boolean;
  onToggle?: (item: ShoppingItem) => void;
  onDelete?: (id: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={item.is_checked}
            disabled={!editable}
            onCheckedChange={() => editable && onToggle?.(item)}
          />
          <span className={cn("flex-1", item.is_checked && "text-muted-foreground line-through")}>
            {item.name}
            {item.quantity ? ` (${item.quantity})` : ""}
          </span>
          {editable && (
            <button
              type="button"
              onClick={() => onDelete?.(item.id)}
              aria-label="Quitar"
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
