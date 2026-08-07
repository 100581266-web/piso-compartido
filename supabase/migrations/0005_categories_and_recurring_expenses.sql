-- Categorías de gasto (para el desglose en Stats) y gastos fijos que se
-- generan solos cada mes (alquiler, wifi, luz...) vía un job programado en
-- la propia base de datos (pg_cron), sin depender de infraestructura extra.

alter table public.expenses
  add column category text not null default 'otros'
  check (category in ('comida', 'suministros', 'ocio', 'hogar', 'transporte', 'otros'));

create table public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  description text not null,
  amount_cents integer not null check (amount_cents > 0),
  category text not null default 'otros'
    check (category in ('comida', 'suministros', 'ocio', 'hogar', 'transporte', 'otros')),
  day_of_month integer not null check (day_of_month between 1 and 28),
  paid_by uuid not null references public.profiles (id),
  active boolean not null default true,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  last_generated_month date
);

alter table public.recurring_expenses enable row level security;

create policy "recurring_expenses_select_members" on public.recurring_expenses
  for select to authenticated using (public.is_household_member(household_id));

create policy "recurring_expenses_insert_members" on public.recurring_expenses
  for insert to authenticated
  with check (public.is_household_member(household_id) and created_by = auth.uid());

create policy "recurring_expenses_update_members" on public.recurring_expenses
  for update to authenticated using (public.is_household_member(household_id));

create policy "recurring_expenses_delete_members" on public.recurring_expenses
  for delete to authenticated using (public.is_household_member(household_id));

-- Recorre los gastos fijos activos cuyo día ya ha llegado este mes y que
-- todavía no se han generado, crea el gasto real y lo reparte a partes
-- iguales entre los miembros actuales del piso.
create function public.generate_recurring_expenses()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  _expense_id uuid;
  _members uuid[];
  _n int;
  _base int;
  _remainder int;
begin
  for r in
    select * from public.recurring_expenses
    where active = true
      and day_of_month <= extract(day from current_date)::int
      and (last_generated_month is null or last_generated_month < date_trunc('month', current_date)::date)
  loop
    select array_agg(user_id order by joined_at) into _members
    from public.household_members
    where household_id = r.household_id;

    if _members is null or array_length(_members, 1) = 0 then
      continue;
    end if;

    insert into public.expenses
      (household_id, paid_by, created_by, description, amount_cents, category, expense_date)
    values
      (r.household_id, r.paid_by, r.paid_by, r.description, r.amount_cents, r.category, current_date)
    returning id into _expense_id;

    _n := array_length(_members, 1);
    _base := r.amount_cents / _n;
    _remainder := r.amount_cents % _n;

    insert into public.expense_shares (household_id, expense_id, user_id, share_cents)
    select
      r.household_id,
      _expense_id,
      _members[i],
      _base + case when i <= _remainder then 1 else 0 end
    from generate_series(1, _n) as i;

    update public.recurring_expenses
    set last_generated_month = date_trunc('month', current_date)::date
    where id = r.id;
  end loop;
end;
$$;

grant execute on function public.generate_recurring_expenses() to authenticated;

-- Requiere la extensión pg_cron (actívala en Supabase Dashboard -> Database
-- -> Extensions si el CREATE EXTENSION de abajo da error de permisos).
create extension if not exists pg_cron;

select cron.schedule(
  'generate-recurring-expenses',
  '0 6 * * *',
  $$select public.generate_recurring_expenses();$$
);
