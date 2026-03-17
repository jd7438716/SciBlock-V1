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
// All fields are optional.  currentModules replaces the entire modules column
// when provided; omit the field entirely to leave it unchanged.
type UpdateExperimentRequest struct {
        Title            *string         `json:"title"`
        ExperimentStatus *string         `json:"experimentStatus"`
        ExperimentCode   *string         `json:"experimentCode"`
        Tags             []string        `json:"tags"`           // nil = no change; [] = clear
        EditorContent    *string         `json:"editorContent"`
        ReportHtml       *string         `json:"reportHtml"`
        CurrentModules   json.RawMessage `json:"currentModules"` // nil = no change; replaces whole column
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

// RecentExperimentItem is the JSON shape for a single entry in the recent-experiments feed.
// It is a JOIN result across experiment_records and sci_notes — never a full ExperimentRecord.
type RecentExperimentItem struct {
        ExperimentID     string    `json:"experimentId"`
        ExperimentTitle  string    `json:"experimentTitle"`
        SciNoteID        string    `json:"sciNoteId"`
        SciNoteTitle     string    `json:"sciNoteTitle"`
        ExperimentStatus string    `json:"experimentStatus"`
        CreatedAt        time.Time `json:"createdAt"`
        UpdatedAt        time.Time `json:"updatedAt"`
}

// ListRecentExperimentsResponse is returned by GET /api/experiments/recent.
type ListRecentExperimentsResponse struct {
        Items []RecentExperimentItem `json:"items"`
}

