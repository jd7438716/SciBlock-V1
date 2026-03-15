-- +goose Up
-- +goose StatementBegin

-- Add role column to users table.
-- Existing rows default to 'student'.
-- 'instructor' is used for PI / lab supervisors who can review weekly reports.
ALTER TABLE users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'student';

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE users DROP COLUMN IF EXISTS role;
-- +goose StatementEnd
