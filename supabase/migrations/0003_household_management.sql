-- Gestión del piso: salir, echar a alguien (admin), regenerar código de
-- invitación (admin). Renombrar el piso no necesita RPC porque ya hay una
-- política RLS de UPDATE para admins sobre households.

create function public.leave_household(_household_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _remaining_count int;
  _was_admin boolean;
begin
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

create function public.remove_household_member(_household_id uuid, _user_id uuid)
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

  delete from public.household_members
  where household_id = _household_id and user_id = _user_id;
end;
$$;

create function public.regenerate_invite_code(_household_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  _code text;
begin
  if not public.is_household_admin(_household_id) then
    raise exception 'Solo un admin puede regenerar el código';
  end if;

  loop
    _code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    begin
      update public.households set invite_code = _code where id = _household_id;
      exit;
    exception when unique_violation then
      -- código duplicado, se reintenta con uno nuevo
    end;
  end loop;

  return _code;
end;
$$;

grant execute on function public.leave_household(uuid) to authenticated;
grant execute on function public.remove_household_member(uuid, uuid) to authenticated;
grant execute on function public.regenerate_invite_code(uuid) to authenticated;
