insert into team_members (name, email, role, is_active)
values
  ('Avery Leader', 'leader@example.com', 'leader', true),
  ('Sam Support', 'support@example.com', 'support', true)
on conflict (email) do update
set
  name = excluded.name,
  role = excluded.role,
  is_active = excluded.is_active;
