package dto

import (
	"encoding/json"
	"time"
)

// CreateExperimentRequest is the JSON body for POST /api/scinotes/:id/records.
type CreateExperimentRequest struct {
	Title              string          `json:"title"`
	PurposeInput       *string         `json:"purposeInput"`
	ExperimentStatus   string          `json:"experimentStatus"`
	ExperimentCode     string          `json:"experimentCode"`
	Tags               []string        `json:"tags"`
	InheritedVersionID *string         `json:"inheritedVersionId"`
	CurrentModules     json.RawMessage `json:"currentModules"` // OntologyModule[] blob
}

// UpdateExperimentRequest is the JSON body for PATCH /api/experiments/:id.
// All fields are optional.
type UpdateExperimentRequest struct {
	Title            *string  `json:"title"`
	ExperimentStatus *string  `json:"experimentStatus"`
	ExperimentCode   *string  `json:"experimentCode"`
	Tags             []string `json:"tags"`        // nil = no change; [] = clear
	EditorContent    *string  `json:"editorContent"`
	ReportHtml       *string  `json:"reportHtml"`
}

// UpdateModuleRequest is the JSON body for PATCH /api/experiments/:id/modules/:key.
// The module field contains a complete serialised OntologyModule object.
type UpdateModuleRequest struct {
	Module json.RawMessage `json:"module"`
}

// ExperimentResponse is the canonical JSON shape for all ExperimentRecord endpoints.
type ExperimentResponse struct {
	ID                 string          `json:"id"`
	SciNoteID          string          `json:"sciNoteId"`
	Title              string          `json:"title"`
	PurposeInput       *string         `json:"purposeInput"`
	ExperimentStatus   string          `json:"experimentStatus"`
	ExperimentCode     string          `json:"experimentCode"`
	Tags               []string        `json:"tags"`
	EditorContent      string          `json:"editorContent"`
	ReportHtml         *string         `json:"reportHtml"`
	CurrentModules     json.RawMessage `json:"currentModules"`
	InheritedVersionID *string         `json:"inheritedVersionId"`
	IsDeleted          bool            `json:"isDeleted"`
	CreatedAt          time.Time       `json:"createdAt"`
	UpdatedAt          time.Time       `json:"updatedAt"`
}

// ListExperimentsResponse is returned by GET /api/scinotes/:id/records.
type ListExperimentsResponse struct {
	Items []ExperimentResponse `json:"items"`
	Total int                  `json:"total"`
}
