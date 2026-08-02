-- Piso Compartido: esquema inicial (households, expenses, chores, shopping)
-- Aplicar en Supabase Dashboard -> SQL Editor -> New query -> pegar y ejecutar.

-- ==========================================================================
-- Tablas
-- ==========================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Nota: created_by/paid_by/assigned_to/etc. referencian public.profiles (no
-- auth.users) para que PostgREST pueda unir automáticamente estas tablas con
-- los datos de perfil (nombre) en una sola consulta desde el cliente.

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  unique (household_id, user_id)
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  paid_by uuid not null references public.profiles (id),
  description text not null,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'EUR',
  expense_date date not null default current_date,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.expense_shares (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  expense_id uuid not null references public.expenses (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  share_cents integer not null check (share_cents >= 0),
  unique (expense_id, user_id)
);

create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  from_user_id uuid not null references public.profiles (id),
  to_user_id uuid not null references public.profiles (id),
  amount_cents integer not null check (amount_cents > 0),
  note text,
  settled_at timestamptz not null default now(),
  check (from_user_id <> to_user_id)
);

create table public.chores (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  description text,
  recurrence_days integer not null default 7 check (recurrence_days > 0),
  rotation_order uuid[] not null default '{}',
  rotation_pointer integer not null default 0,
  active boolean not null default true,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.chore_assignments (
  id uuid primary key default gen_random_uuid(),
  chore_id uuid not null references public.chores (id) on delete cascade,
  household_id uuid not null references public.households (id) on delete cascade,
  assigned_to uuid not null references public.profiles (id),
  due_date date not null,
  status text not null default 'pending' check (status in ('pending', 'done', 'skipped')),
  completed_at timestamptz,
  completed_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  quantity text,
  added_by uuid not null references public.profiles (id),
  is_checked boolean not null default false,
  checked_by uuid references public.profiles (id),
  checked_at timestamptz,
  created_at timestamptz not null default now()
);

-- ==========================================================================
-- Perfil automático al registrarse
-- ==========================================================================

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ==========================================================================
-- Helpers de autorización (security definer para evitar recursión en RLS)
-- ==========================================================================

create function public.is_household_member(_household_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.household_members
    where household_id = _household_id and user_id = auth.uid()
  );
$$;

create function public.is_household_admin(_household_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.household_members
    where household_id = _household_id and user_id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_household_member(uuid) to authenticated;
grant execute on function public.is_household_admin(uuid) to authenticated;

-- ==========================================================================
-- Crear / unirse a un piso (RPCs security definer; el cliente nunca inserta
-- directamente en households/household_members)
-- ==========================================================================

create function public.create_household(_name text)
returns public.households
language plpgsql
security definer
set search_path = public
as $$
declare
  _code text;
  _household public.households;
begin
  loop
    _code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    begin
      insert into public.households (name, invite_code, created_by)
      values (_name, _code, auth.uid())
      returning * into _household;
      exit;
    exception when unique_violation then
      -- código duplicado, se reintenta con uno nuevo
    end;
  end loop;

  insert into public.household_members (household_id, user_id, role)
  values (_household.id, auth.uid(), 'admin');

  return _household;
end;
$$;

create function public.join_household(_invite_code text)
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

  insert into public.household_members (household_id, user_id, role)
  values (_household.id, auth.uid(), 'member')
  on conflict (household_id, user_id) do nothing;

  return _household;
end;
$$;

grant execute on function public.create_household(text) to authenticated;
grant execute on function public.join_household(text) to authenticated;

-- ==========================================================================
-- Row Level Security
-- ==========================================================================

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_shares enable row level security;
alter table public.settlements enable row level security;
alter table public.chores enable row level security;
alter table public.chore_assignments enable row level security;
alter table public.shopping_items enable row level security;

-- profiles: visibles para cualquier usuario autenticado (sin datos sensibles),
-- solo editable por su dueño
create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated using (true);

create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- households: solo visibles/editables por miembros (la creación va por RPC)
create policy "households_select_members" on public.households
  for select to authenticated using (public.is_household_member(id));

create policy "households_update_admins" on public.households
  for update to authenticated using (public.is_household_admin(id));

-- household_members: solo visibles por miembros (altas van por RPC)
create policy "household_members_select_members" on public.household_members
  for select to authenticated using (public.is_household_member(household_id));

-- expenses
create policy "expenses_select_members" on public.expenses
  for select to authenticated using (public.is_household_member(household_id));

create policy "expenses_insert_members" on public.expenses
  for insert to authenticated
  with check (public.is_household_member(household_id) and created_by = auth.uid());

create policy "expenses_update_members" on public.expenses
  for update to authenticated using (public.is_household_member(household_id));

create policy "expenses_delete_members" on public.expenses
  for delete to authenticated using (public.is_household_member(household_id));

-- expense_shares
create policy "expense_shares_select_members" on public.expense_shares
  for select to authenticated using (public.is_household_member(household_id));

create policy "expense_shares_insert_members" on public.expense_shares
  for insert to authenticated
  with check (public.is_household_member(household_id));

create policy "expense_shares_delete_members" on public.expense_shares
  for delete to authenticated using (public.is_household_member(household_id));

-- settlements
create policy "settlements_select_members" on public.settlements
  for select to authenticated using (public.is_household_member(household_id));

create policy "settlements_insert_members" on public.settlements
  for insert to authenticated
  with check (public.is_household_member(household_id) and from_user_id = auth.uid());

-- chores
create policy "chores_select_members" on public.chores
  for select to authenticated using (public.is_household_member(household_id));

create policy "chores_insert_members" on public.chores
  for insert to authenticated
  with check (public.is_household_member(household_id) and created_by = auth.uid());

create policy "chores_update_members" on public.chores
  for update to authenticated using (public.is_household_member(household_id));

create policy "chores_delete_members" on public.chores
  for delete to authenticated using (public.is_household_member(household_id));

-- chore_assignments
create policy "chore_assignments_select_members" on public.chore_assignments
  for select to authenticated using (public.is_household_member(household_id));

create policy "chore_assignments_insert_members" on public.chore_assignments
  for insert to authenticated
  with check (public.is_household_member(household_id));

create policy "chore_assignments_update_members" on public.chore_assignments
  for update to authenticated using (public.is_household_member(household_id));

-- shopping_items
create policy "shopping_items_select_members" on public.shopping_items
  for select to authenticated using (public.is_household_member(household_id));

create policy "shopping_items_insert_members" on public.shopping_items
  for insert to authenticated
  with check (public.is_household_member(household_id) and added_by = auth.uid());

create policy "shopping_items_update_members" on public.shopping_items
  for update to authenticated using (public.is_household_member(household_id));

create policy "shopping_items_delete_members" on public.shopping_items
  for delete to authenticated using (public.is_household_member(household_id));
