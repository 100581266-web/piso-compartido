-- Al salir o echar a alguien del piso, se liquida automáticamente toda su
-- huella financiera en ese piso (lo que pagó, lo que le tocaba pagar, y
-- cualquier liquidación pendiente), para que no queden saldos "fantasma"
-- de gente que ya no está en el piso.

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
  delete from public.expenses
  where household_id = _household_id and paid_by = auth.uid();

  delete from public.expense_shares
  where household_id = _household_id and user_id = auth.uid();

  delete from public.settlements
  where household_id = _household_id
    and (from_user_id = auth.uid() or to_user_id = auth.uid());

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

  delete from public.expenses
  where household_id = _household_id and paid_by = _user_id;

  delete from public.expense_shares
  where household_id = _household_id and user_id = _user_id;

  delete from public.settlements
  where household_id = _household_id
    and (from_user_id = _user_id or to_user_id = _user_id);

  update public.recurring_expenses
  set active = false
  where household_id = _household_id and paid_by = _user_id;

  delete from public.household_members
  where household_id = _household_id and user_id = _user_id;
end;
$$;

-- Limpieza puntual: borra rastros financieros de gente que ya no está en
-- el piso (esto es lo que está descuadrando tu saldo ahora mismo).
delete from public.expense_shares es
where not exists (
  select 1 from public.household_members hm
  where hm.household_id = es.household_id and hm.user_id = es.user_id
);

delete from public.settlements s
where not exists (
    select 1 from public.household_members hm
    where hm.household_id = s.household_id and hm.user_id = s.from_user_id
  )
  or not exists (
    select 1 from public.household_members hm
    where hm.household_id = s.household_id and hm.user_id = s.to_user_id
  );

delete from public.expenses e
where not exists (
  select 1 from public.household_members hm
  where hm.household_id = e.household_id and hm.user_id = e.paid_by
);
