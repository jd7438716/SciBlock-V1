INSERT INTO users (id, email, password_hash, name, role)
SELECT gen_random_uuid(), 'test@example.com', '$2b$10$SD9tNwcBsDakfftD0Kx1guScCXYyAdsizAtvE.rpKGeg.INs7KuTK', 'Test User', 'student'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'test@example.com');