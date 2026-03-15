package domain

import (
        "encoding/json"
        "time"
)

// ExperimentStatus mirrors the frontend enum.
type ExperimentStatus = string

const (
        StatusExploring    ExperimentStatus = "探索中"
        StatusReproducible ExperimentStatus = "可复现"
        StatusFailed       ExperimentStatus = "失败"
        StatusVerified     ExperimentStatus = "已验证"
)

// ExperimentRecord is a single experiment run inside a SciNote.
//
// CurrentModules stores OntologyModule[] as an opaque JSON blob — the Go
// backend does not parse the individual module structure.  When a single
// module key is updated (PATCH /api/experiments/:id/modules/:key), the
// service layer merges the new module into the existing JSON array in the
// database without full re-serialization of all modules.
type ExperimentRecord struct {
        ID                 string
        SciNoteID          string
        Title              string
        PurposeInput       *string
        ExperimentStatus   ExperimentStatus
        ExperimentCode     string
        Tags               []string
        EditorContent      string
        ReportHtml         *string
        CurrentModules     json.RawMessage // OntologyModule[] opaque blob
        InheritedVersionID *string         // forward ref to ontology_versions (Phase 2)
        IsDeleted          bool
        CreatedAt          time.Time
        UpdatedAt          time.Time
}

// ExperimentPatch carries optional update fields for PATCH /api/experiments/:id.
// Only non-nil fields are written to the database.
// Tags nil = no change; Tags []string{} = clear to empty array.
// CurrentModules nil = no change; non-nil replaces the entire current_modules column.
type ExperimentPatch struct {
        Title            *string
        ExperimentStatus *string
        ExperimentCode   *string
        Tags             []string
        EditorContent    *string
        ReportHtml       *string
        CurrentModules   json.RawMessage // nil = no change; non-nil replaces whole column
}
