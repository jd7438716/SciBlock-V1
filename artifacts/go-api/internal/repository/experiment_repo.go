package repository

import (
	"context"
	"encoding/json"

	"sciblock/go-api/internal/domain"
)

// ExperimentRepository defines all database operations for experiment_records.
type ExperimentRepository interface {
	// ListBySciNote returns ExperimentRecords under the given SciNote.
	// When includeDeleted is false only is_deleted=false rows are returned.
	ListBySciNote(ctx context.Context, sciNoteID string, includeDeleted bool) ([]domain.ExperimentRecord, error)

	// GetByID retrieves a single ExperimentRecord by primary key.
	// Returns nil, nil when not found.
	GetByID(ctx context.Context, id string) (*domain.ExperimentRecord, error)

	// Create inserts a new ExperimentRecord row and returns the persisted record.
	Create(ctx context.Context, rec domain.ExperimentRecord) (*domain.ExperimentRecord, error)

	// Update applies a partial patch to an existing ExperimentRecord.
	// Only non-nil fields in the patch are written.
	Update(ctx context.Context, id string, patch domain.ExperimentPatch) (*domain.ExperimentRecord, error)

	// UpdateModules replaces the current_modules jsonb column with the
	// provided raw JSON.  Called by the module-level PATCH endpoint.
	UpdateModules(ctx context.Context, id string, modules json.RawMessage) error

	// SoftDelete sets is_deleted=true on the given ExperimentRecord.
	SoftDelete(ctx context.Context, id string) error

	// Restore sets is_deleted=false on the given ExperimentRecord.
	Restore(ctx context.Context, id string) error
}

// TODO: implement pgxExperimentRepository
