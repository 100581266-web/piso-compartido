-- Datos de ejemplo para el modo demo público ("Ver demo" en el login).
-- Requiere que ya existan 3 usuarios creados a mano en Authentication ->
-- Users (con "Auto Confirm User" marcado):
--   demo1@example.com -> Ana
--   demo2@example.com -> Pablo
--   demo3@example.com -> Sara
--
-- Se puede volver a ejecutar entero cuando haga falta "resetear" la demo:
-- borra el piso demo anterior (por su invite_code fijo) y lo vuelve a crear
-- desde cero con datos frescos.

do $$
declare
  _ana uuid;
  _pablo uuid;
  _sara uuid;
  _household_id uuid;
  _chore1 uuid;
  _chore2 uuid;
  _expense1 uuid;
  _expense2 uuid;
  _expense3 uuid;
  _expense4 uuid;
begin
  select id into _ana from auth.users where email = 'demo1@example.com';
  select id into _pablo from auth.users where email = 'demo2@example.com';
  select id into _sara from auth.users where email = 'demo3@example.com';

  if _ana is null or _pablo is null or _sara is null then
    raise exception 'Crea primero los 3 usuarios demo en Authentication -> Users antes de correr este script.';
  end if;

  update public.profiles set display_name = 'Ana' where id = _ana;
  update public.profiles set display_name = 'Pablo' where id = _pablo;
  update public.profiles set display_name = 'Sara' where id = _sara;

  delete from public.households where invite_code = 'DEMO01';

  insert into public.households (name, invite_code, created_by)
  values ('Piso Demo', 'DEMO01', _ana)
  returning id into _household_id;

  insert into public.household_members (household_id, user_id, role, joined_at)
  values
    (_household_id, _ana, 'admin', now() - interval '90 days'),
    (_household_id, _pablo, 'member', now() - interval '60 days'),
    (_household_id, _sara, 'member', now() - interval '30 days');

  -- Gastos: mezcla de reparto igual y por importes exactos
  insert into public.expenses (id, household_id, paid_by, created_by, description, amount_cents, category)
  values (gen_random_uuid(), _household_id, _ana, _ana, 'Compra Mercadona', 4560, 'comida')
  returning id into _expense1;
  insert into public.expense_shares (household_id, expense_id, user_id, share_cents)
  values
    (_household_id, _expense1, _ana, 1520),
    (_household_id, _expense1, _pablo, 1520),
    (_household_id, _expense1, _sara, 1520);

  insert into public.expenses (id, household_id, paid_by, created_by, description, amount_cents, category)
  values (gen_random_uuid(), _household_id, _pablo, _pablo, 'Factura de la luz', 7830, 'suministros')
  returning id into _expense2;
  insert into public.expense_shares (household_id, expense_id, user_id, share_cents)
  values
    (_household_id, _expense2, _ana, 2610),
    (_household_id, _expense2, _pablo, 2610),
    (_household_id, _expense2, _sara, 2610);

  insert into public.expenses (id, household_id, paid_by, created_by, description, amount_cents, category)
  values (gen_random_uuid(), _household_id, _sara, _sara, 'Cena para celebrar', 6000, 'ocio')
  returning id into _expense3;
  insert into public.expense_shares (household_id, expense_id, user_id, share_cents)
  values
    (_household_id, _expense3, _ana, 2500),
    (_household_id, _expense3, _pablo, 2000),
    (_household_id, _expense3, _sara, 1500);

  insert into public.expenses (id, household_id, paid_by, created_by, description, amount_cents, category)
  values (gen_random_uuid(), _household_id, _ana, _ana, 'Productos de limpieza', 1890, 'hogar')
  returning id into _expense4;
  insert into public.expense_shares (household_id, expense_id, user_id, share_cents)
  values
    (_household_id, _expense4, _ana, 630),
    (_household_id, _expense4, _pablo, 630),
    (_household_id, _expense4, _sara, 630);

  -- Una liquidación ya hecha, para que se vea el historial de pagos
  insert into public.settlements (household_id, from_user_id, to_user_id, amount_cents, settled_at)
  values (_household_id, _pablo, _ana, 1000, now() - interval '5 days');

  -- Gasto fijo
  insert into public.recurring_expenses (household_id, description, amount_cents, category, day_of_month, paid_by, created_by)
  values (_household_id, 'Wifi', 3500, 'suministros', 5, _pablo, _pablo);

  -- Tareas: una atrasada, una próxima, y una ya completada (para el historial)
  insert into public.chores (id, household_id, name, recurrence_days, rotation_order, created_by)
  values (gen_random_uuid(), _household_id, 'Sacar la basura', 3, array[_ana, _pablo, _sara], _ana)
  returning id into _chore1;
  insert into public.chore_assignments (chore_id, household_id, assigned_to, due_date, status)
  values (_chore1, _household_id, _sara, current_date - 1, 'pending');

  insert into public.chores (id, household_id, name, recurrence_days, rotation_order, created_by)
  values (gen_random_uuid(), _household_id, 'Limpiar la cocina', 7, array[_pablo, _sara, _ana], _pablo)
  returning id into _chore2;
  insert into public.chore_assignments (chore_id, household_id, assigned_to, due_date, status)
  values (_chore2, _household_id, _ana, current_date + 2, 'pending');
  insert into public.chore_assignments
    (chore_id, household_id, assigned_to, due_date, status, completed_at, completed_by)
  values
    (_chore2, _household_id, _sara, current_date - 5, 'done', (current_date - 4)::timestamptz, _sara);

  -- Lista de la compra: compartida + un artículo personal
  insert into public.shopping_items
    (household_id, name, quantity, added_by, owner_user_id, is_checked, checked_by, checked_at)
  values
    (_household_id, 'Leche', '2L', _ana, null, false, null, null),
    (_household_id, 'Huevos', null, _pablo, null, true, _pablo, now() - interval '1 day'),
    (_household_id, 'Café', null, _sara, _sara, false, null, null);
end $$;
