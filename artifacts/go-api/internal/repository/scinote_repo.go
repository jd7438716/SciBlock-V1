package repository

import (
	"context"
	"encoding/json"

	"sciblock/go-api/internal/domain"
)

// SciNoteRepository defines all database operations for the scinotes table.
// The interface is the dependency boundary: services depend on this abstraction,
// not on the concrete pgx implementation.
type SciNoteRepository interface {
	// ListByUser returns all non-deleted SciNotes owned by the given user,
	// ordered by updated_at DESC.
	ListByUser(ctx context.Context, userID string) ([]domain.SciNote, error)

	// GetByID retrieves a single SciNote by primary key (regardless of is_deleted status).
	// Returns nil, nil when not found.
	GetByID(ctx context.Context, id string) (*domain.SciNote, error)

	// Create inserts a new SciNote row and returns the persisted record
	// (with server-assigned id, created_at, updated_at).
	Create(ctx context.Context, note domain.SciNote) (*domain.SciNote, error)

	// Update applies a partial patch to an existing SciNote.
	// Only non-nil fields in the patch are written.
	// Returns the updated record.
	Update(ctx context.Context, id string, patch domain.SciNotePatch) (*domain.SciNote, error)

	// SoftDelete sets is_deleted=true on the given SciNote.
	SoftDelete(ctx context.Context, id string) error

	// SetInitialModules writes heritable modules into scinotes.initial_modules
	// ONLY when the column is currently NULL (immutable after first write).
	// No-op when initial_modules is already set.
	// Returns the current (possibly unchanged) SciNote.
	SetInitialModules(ctx context.Context, id string, modules json.RawMessage) (*domain.SciNote, error)

	// AdvanceContext atomically:
	//   1. Updates current_confirmed_modules = newModules.
	//   2. Increments context_version by 1.
	//   3. Sets last_confirmed_record_id = lastRecordID.
	//   4. Sets last_confirmed_record_seq = lastRecordSeq.
	// Returns the new context_version after the update.
	AdvanceContext(
		ctx context.Context,
		id string,
		newModules json.RawMessage,
		lastRecordID string,
		lastRecordSeq int,
	) (newContextVersion int, err error)
}
