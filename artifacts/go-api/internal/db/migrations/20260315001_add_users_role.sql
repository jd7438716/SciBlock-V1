-- +goose Up
-- +goose StatementBegin

-- Ensure users table exists with role column.
-- This migration is idempotent: safe to run even if users table already has role column.
-- 'instructor' is used for PI / lab supervisors who can review weekly reports.
CREATE TABLE IF NOT EXISTS users (
    id            text        PRIMARY KEY DEFAULT gen_random_uuid(),
    email         text        NOT NULL UNIQUE,
    password_hash text        NOT NULL,
    name          text        NOT NULL,
    role          text        NOT NULL DEFAULT 'student',
    created_at    timestamptz NOT NULL DEFAULT now()
);

-- Add role column if table already existed without it
ALTER TABLE users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'student';

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- Cannot safely drop the column as other systems may depend on it.
-- Use manual migration if removal is required.
-- +goose StatementEnd
