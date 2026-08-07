-- Permite borrar una liquidación (por ejemplo, si el gasto que la originó
-- se borró después y dejó el pago huérfano, descuadrando el saldo).
create policy "settlements_delete_members" on public.settlements
  for delete to authenticated using (public.is_household_member(household_id));
