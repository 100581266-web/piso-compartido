-- Permite que tanto quien debe dinero como a quien se lo deben pueda
-- registrar que un pago ya se ha hecho en persona (antes solo podía
-- hacerlo quien debía).
drop policy "settlements_insert_members" on public.settlements;
create policy "settlements_insert_members" on public.settlements
  for insert to authenticated
  with check (
    public.is_household_member(household_id)
    and (from_user_id = auth.uid() or to_user_id = auth.uid())
  );
