-- Al salir o echar a alguien del piso, ya NO se borra su historial
-- financiero (gastos que pagó, su parte de gastos de otros, liquidaciones).
--
-- La versión anterior (0007) borraba todos los gastos pagados por la
-- persona que se iba, y como expense_shares tiene "on delete cascade" hacia
-- expenses, eso se llevaba por delante también la parte que le debían sus
-- compañeros por esos gastos: la deuda desaparecía sin que nadie la
-- saldara realmente.
--
-- Ahora solo se desactivan sus gastos fijos (para que no se sigan
-- generando a su nombre) y se le quita del piso; su rastro financiero se
-- queda tal cual, igual que al salir de un grupo en Splitwise o Tricount.
-- Los saldos pendientes con esa persona se pueden seguir viendo y saldando
-- desde "Para saldar cuentas" aunque ya no sea miembro del piso.

create or replace function public.leave_household(_household_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _remaining_count int;
  _was_admin boolean;
begin
  update public.recurring_expenses
  set active = false
  where household_id = _household_id and paid_by = auth.uid();

  select role = 'admin' into _was_admin
  from public.household_members
  where household_id = _household_id and user_id = auth.uid();

  delete from public.household_members
  where household_id = _household_id and user_id = auth.uid();

  select count(*) into _remaining_count
  from public.household_members
  where household_id = _household_id;

  if _remaining_count = 0 then
    delete from public.households where id = _household_id;
  elsif _was_admin and not exists (
    select 1 from public.household_members
    where household_id = _household_id and role = 'admin'
  ) then
    update public.household_members
    set role = 'admin'
    where id = (
      select id from public.household_members
      where household_id = _household_id
      order by joined_at asc
      limit 1
    );
  end if;
end;
$$;

create or replace function public.remove_household_member(_household_id uuid, _user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_household_admin(_household_id) then
    raise exception 'Solo un admin puede echar a alguien del piso';
  end if;

  if _user_id = auth.uid() then
    raise exception 'Usa la opción de salir del piso para ti mismo';
  end if;

  update public.recurring_expenses
  set active = false
  where household_id = _household_id and paid_by = _user_id;

  delete from public.household_members
  where household_id = _household_id and user_id = _user_id;
end;
$$;
