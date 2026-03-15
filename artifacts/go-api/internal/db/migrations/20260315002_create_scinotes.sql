-- +goose Up
-- +goose StatementBegin

-- scinotes: experiment notebook containers created by the 6-step wizard.
--
-- Relationship to Express tables:
--   user_id → users.id  (owner; the Express auth module manages users)
--
-- form_data stores the full WizardFormData JSON blob (Steps 2–6).
-- Go backend treats this as an opaque jsonb — it does NOT parse the
-- internal structure.  The frontend is responsible for interpretation.
CREATE TABLE IF NOT EXISTS scinotes (
    id              text        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         text        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           text        NOT NULL,
    -- 'wizard'       → created via the 6-step initialization wizard
    -- 'placeholder'  → legacy seed entry (no formData)
    kind            text        NOT NULL DEFAULT 'wizard',
    experiment_type text,
    objective       text,
    -- Complete WizardFormData (step2..step6) stored as JSON.
    -- Null for kind='placeholder'.
    form_data       jsonb,
    is_deleted      boolean     NOT NULL DEFAULT false,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scinotes_user_id    ON scinotes (user_id);
CREATE INDEX IF NOT EXISTS idx_scinotes_updated_at ON scinotes (updated_at DESC);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS idx_scinotes_updated_at;
DROP INDEX IF EXISTS idx_scinotes_user_id;
DROP TABLE IF EXISTS scinotes;
-- +goose StatementEnd
