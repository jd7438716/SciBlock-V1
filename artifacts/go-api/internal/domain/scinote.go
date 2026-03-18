package domain

import (
	"encoding/json"
	"time"
)

// SciNote is a named experiment notebook created by the 6-step initialization wizard.
//
// FormData stores the complete WizardFormData JSON as a raw byte slice.
// The Go backend treats it as an opaque blob and never parses the internal
// structure — that is the frontend's responsibility.  This means backend code
// is decoupled from changes to the wizard step schemas.
//
// Inheritance-chain fields (added in migration 20260315004):
//   - InitialModules            : heritable module snapshot from wizard; immutable after first set.
//   - CurrentConfirmedModules   : latest confirmed heritable snapshot; advances on each confirm.
//   - ContextVersion            : monotonic counter; incremented each time the context advances.
//   - LastConfirmedRecordID     : ID of the record that last advanced the context.
//   - LastConfirmedRecordSeq    : sequence_number of that record (for banner display).
type SciNote struct {
	ID             string
	UserID         string
	Title          string
	Kind           string          // "wizard" | "placeholder"
	ExperimentType *string         // nil if not set
	Objective      *string         // nil if not set
	FormData       json.RawMessage // opaque JSON blob; nil for kind="placeholder"
	IsDeleted      bool
	CreatedAt      time.Time
	UpdatedAt      time.Time

	// Inheritance-chain fields
	InitialModules           json.RawMessage // heritable modules from wizard; nil until first record
	CurrentConfirmedModules  json.RawMessage // nil until first confirm
	ContextVersion           int
	LastConfirmedRecordID    *string
	LastConfirmedRecordSeq   *int
}

// SciNotePatch carries the fields that may be updated via PATCH /api/scinotes/:id.
// A nil pointer means "no change to this field".
// FormData nil means "no change"; a zero-length slice means "clear" (not supported yet).
type SciNotePatch struct {
	Title          *string
	ExperimentType *string
	Objective      *string
	FormData       json.RawMessage // nil = no change
	InitialModules json.RawMessage // nil = no change (only set once; guarded in repo)
}
