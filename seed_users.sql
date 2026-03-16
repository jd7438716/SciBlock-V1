-- Insert dev instructor
INSERT INTO users (id, email, password_hash, name, role)
VALUES (
  gen_random_uuid(),
  'dev@sciblock.local',
  '$2b$12$O.HV5cwP0MzzwbTQfe7MQ.imWTswjtndn6ZrjDjN3YAO5AXx6Erp2',
  'Dev User',
  'instructor'
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  role = EXCLUDED.role;

-- Insert demo student
INSERT INTO users (id, email, password_hash, name, role)
VALUES (
  gen_random_uuid(),
  'demo@sciblock.com',
  '$2b$12$PquTYT7VMjYD1rr4Ylm2OuYcpzRl4gY51uxxU2xWtQ1F/HRQhIh8G',
  'Demo Student',
  'student'
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  role = EXCLUDED.role;