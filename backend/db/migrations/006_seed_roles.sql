INSERT INTO roles (role_name, permissions_json) VALUES
  ('viewer',  '{"read":true,"write":false,"analytics":false,"manage_users":false}'),
  ('analyst', '{"read":true,"write":true,"analytics":true,"manage_users":false}'),
  ('admin',   '{"read":true,"write":true,"analytics":true,"manage_users":true}')
ON CONFLICT (role_name) DO UPDATE SET permissions_json = EXCLUDED.permissions_json;