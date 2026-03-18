-- +goose Up
-- +goose StatementBegin

-- ---------------------------------------------------------------------------
-- scinotes: add inheritance-chain context columns.
--
-- initial_modules            : heritable modules from wizard init; set once, immutable.
-- current_confirmed_modules  : latest confirmed heritable snapshot; updated on each confirm.
-- context_version            : monotonically increasing counter; bumped each time
--                              current_confirmed_modules advances.
-- last_confirmed_record_id   : ID of the record that last advanced the context.
-- last_confirmed_record_seq  : sequence_number of that record (for banner display).
-- ---------------------------------------------------------------------------
ALTER TABLE scinotes
    ADD COLUMN IF NOT EXISTS initial_modules            jsonb,
    ADD COLUMN IF NOT EXISTS current_confirmed_modules  jsonb,
    ADD COLUMN IF NOT EXISTS context_version            integer     NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_confirmed_record_id   text,
    ADD COLUMN IF NOT EXISTS last_confirmed_record_seq  integer;

-- ---------------------------------------------------------------------------
-- experiment_records: add confirmation-state and lineage-tracking columns.
--
-- confirmation_state     : 'draft' | 'confirmed' | 'confirmed_dirty'
-- confirmed_at           : timestamp of the most recent confirm action.
-- confirmed_modules      : heritable modules snapshot at the time of last confirm.
--                          NULL until first confirm.
-- sequence_number        : ordinal position of this record within its SciNote (1-based).
-- derived_from_source_type : 'initial' | 'record' — where this record's defaults came from.
-- derived_from_record_id   : ID of the source record (NULL when source = 'initial').
-- derived_from_record_seq  : sequence_number of the source record (for banner text).
-- derived_from_context_ver : context_version of the SciNote at record creation time.
-- ---------------------------------------------------------------------------
ALTER TABLE experiment_records
    ADD COLUMN IF NOT EXISTS sequence_number            integer     NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS confirmation_state         text        NOT NULL DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS confirmed_at               timestamptz,
    ADD COLUMN IF NOT EXISTS confirmed_modules          jsonb,
    ADD COLUMN IF NOT EXISTS derived_from_source_type   text        NOT NULL DEFAULT 'initial',
    ADD COLUMN IF NOT EXISTS derived_from_record_id     text,
    ADD COLUMN IF NOT EXISTS derived_from_record_seq    integer,
    ADD COLUMN IF NOT EXISTS derived_from_context_ver   integer     NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_exp_records_confirmation_state
    ON experiment_records (confirmation_state);

CREATE INDEX IF NOT EXISTS idx_exp_records_sci_note_seq
    ON experiment_records (sci_note_id, sequence_number);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP INDEX IF EXISTS idx_exp_records_sci_note_seq;
DROP INDEX IF EXISTS idx_exp_records_confirmation_state;

ALTER TABLE experiment_records
    DROP COLUMN IF EXISTS derived_from_context_ver,
    DROP COLUMN IF EXISTS derived_from_record_seq,
    DROP COLUMN IF EXISTS derived_from_record_id,
    DROP COLUMN IF EXISTS derived_from_source_type,
    DROP COLUMN IF EXISTS confirmed_modules,
    DROP COLUMN IF EXISTS confirmed_at,
    DROP COLUMN IF EXISTS confirmation_state,
    DROP COLUMN IF EXISTS sequence_number;

ALTER TABLE scinotes
    DROP COLUMN IF EXISTS last_confirmed_record_seq,
    DROP COLUMN IF EXISTS last_confirmed_record_id,
    DROP COLUMN IF EXISTS context_version,
    DROP COLUMN IF EXISTS current_confirmed_modules,
    DROP COLUMN IF EXISTS initial_modules;

-- +goose StatementEnd
