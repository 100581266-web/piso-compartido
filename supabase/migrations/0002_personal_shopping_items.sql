-- Soporta pisos donde cada compañero gestiona su propia comida por separado,
-- además de la lista compartida. Un artículo con owner_user_id NULL es
-- compartido (editable por cualquier miembro, como hasta ahora); un artículo
-- con owner_user_id relleno es personal (solo su dueño puede marcarlo/borrarlo,
-- pero todo el piso puede verlo, para saber de quién es cada cosa).

alter table public.shopping_items
  add column owner_user_id uuid references public.profiles (id);

drop policy "shopping_items_insert_members" on public.shopping_items;
create policy "shopping_items_insert_members" on public.shopping_items
  for insert to authenticated
  with check (
    public.is_household_member(household_id)
    and added_by = auth.uid()
    and (owner_user_id is null or owner_user_id = auth.uid())
  );

drop policy "shopping_items_update_members" on public.shopping_items;
create policy "shopping_items_update_members" on public.shopping_items
  for update to authenticated
  using (
    public.is_household_member(household_id)
    and (owner_user_id is null or owner_user_id = auth.uid())
  );

drop policy "shopping_items_delete_members" on public.shopping_items;
create policy "shopping_items_delete_members" on public.shopping_items
  for delete to authenticated
  using (
    public.is_household_member(household_id)
    and (owner_user_id is null or owner_user_id = auth.uid())
  );
