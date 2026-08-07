-- Avisos dentro de la app: se generan automáticamente por triggers cuando
-- pasa algo relevante (gasto nuevo, tarea asignada, alguien se une), así el
-- código de la app no tiene que acordarse de crearlos a mano.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  message text not null,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "notifications_select_own" on public.notifications
  for select to authenticated using (user_id = auth.uid());

create policy "notifications_update_own" on public.notifications
  for update to authenticated using (user_id = auth.uid());

create policy "notifications_delete_own" on public.notifications
  for delete to authenticated using (user_id = auth.uid());

alter publication supabase_realtime add table public.notifications;

-- Nuevo gasto: avisa a todos menos a quien lo ha creado
create function public.notify_new_expense()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (household_id, user_id, message, link)
  select
    new.household_id,
    hm.user_id,
    coalesce((select display_name from public.profiles where id = new.created_by), 'Alguien')
      || ' ha añadido un gasto: ' || new.description,
    '/household/expenses'
  from public.household_members hm
  where hm.household_id = new.household_id
    and hm.user_id <> new.created_by;
  return new;
end;
$$;

create trigger on_expense_created
  after insert on public.expenses
  for each row execute function public.notify_new_expense();

-- Nueva asignación de tarea: avisa a quien le toca
create function public.notify_chore_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _chore_name text;
begin
  select name into _chore_name from public.chores where id = new.chore_id;

  insert into public.notifications (household_id, user_id, message, link)
  values (
    new.household_id,
    new.assigned_to,
    'Te toca: ' || coalesce(_chore_name, 'una tarea'),
    '/household/chores'
  );
  return new;
end;
$$;

create trigger on_chore_assignment_created
  after insert on public.chore_assignments
  for each row execute function public.notify_chore_assignment();

-- Nuevo compañero: avisa al resto del piso
create function public.notify_new_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (household_id, user_id, message, link)
  select
    new.household_id,
    hm.user_id,
    coalesce((select display_name from public.profiles where id = new.user_id), 'Alguien')
      || ' se ha unido al piso',
    '/household'
  from public.household_members hm
  where hm.household_id = new.household_id
    and hm.user_id <> new.user_id;
  return new;
end;
$$;

create trigger on_member_joined
  after insert on public.household_members
  for each row execute function public.notify_new_member();
