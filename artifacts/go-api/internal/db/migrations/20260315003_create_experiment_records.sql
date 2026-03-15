-- +goose Up
-- +goose StatementBegin

-- experiment_records: individual experiment runs under a SciNote.
--
-- Each row corresponds to one WorkbenchContext "ExperimentRecord" that was
-- previously stored only in the browser's sessionStorage.
--
-- current_modules stores the live working copy of OntologyModule[] as jsonb.
-- Go backend treats this as an opaque blob — it does NOT parse individual
-- module fields.  The frontend deserialises and displays the structure.
--
-- inherited_version_id is a forward-reference to the ontology_versions table
-- which will be created in a later migration.  It is nullable and has no FK
-- constraint at this stage to avoid ordering issues.
CREATE TABLE IF NOT EXISTS experiment_records (
    id                   text        PRIMARY KEY DEFAULT gen_random_uuid(),
    sci_note_id          text        NOT NULL REFERENCES scinotes(id) ON DELETE CASCADE,
    title                text        NOT NULL,
    purpose_input        text,
    -- '探索中' | '可复现' | '失败' | '已验证'
    experiment_status    text        NOT NULL DEFAULT '探索中',
    experiment_code      text        NOT NULL DEFAULT '',
    tags                 text[]      NOT NULL DEFAULT '{}',
    -- TipTap HTML content from the editor panel.
    editor_content       text        NOT NULL DEFAULT '',
    -- AI-generated experiment report HTML.  Null until the report is generated.
    report_html          text,
    -- OntologyModule[] JSON (live working copy; may diverge from the inherited version).
    current_modules      jsonb,
    -- References ontology_versions.id (table added in a later migration).
    -- Nullable, no FK constraint yet.
    inherited_version_id text,
    -- Soft-delete flag.  Replaces the in-memory TrashContext behaviour.
    is_deleted           boolean     NOT NULL DEFAULT false,
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exp_records_sci_note_id ON experiment_records (sci_note_id);
CREATE INDEX IF NOT EXISTS idx_exp_records_created_at  ON experiment_records (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exp_records_is_deleted  ON experiment_records (is_deleted);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS idx_exp_records_is_deleted;
DROP INDEX IF EXISTS idx_exp_records_created_at;
DROP INDEX IF EXISTS idx_exp_records_sci_note_id;
DROP TABLE IF EXISTS experiment_records;
-- +goose StatementEnd
