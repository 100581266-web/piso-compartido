-- Nada impedía que alguien se uniera a un segundo piso sin salir antes del
-- primero (por ejemplo, al abrir por error un enlace de invitación viejo).
-- Como el resto de la app asume "un piso por persona" (requireHousehold
-- solo mira el primer household_members que encuentra), esto dejaba a esa
-- persona viendo datos de un piso u otro de forma no determinista.

create or replace function public.join_household(_invite_code text)
returns public.households
language plpgsql
security definer
set search_path = public
as $$
declare
  _household public.households;
begin
  select * into _household
  from public.households
  where invite_code = upper(_invite_code);

  if not found then
    raise exception 'Código de invitación no válido';
  end if;

  if exists (
    select 1 from public.household_members
    where user_id = auth.uid() and household_id <> _household.id
  ) then
    raise exception 'Ya perteneces a otro piso. Sal de tu piso actual antes de unirte a este.';
  end if;

  insert into public.household_members (household_id, user_id, role)
  values (_household.id, auth.uid(), 'member')
  on conflict (household_id, user_id) do nothing;

  return _household;
end;
$$;
