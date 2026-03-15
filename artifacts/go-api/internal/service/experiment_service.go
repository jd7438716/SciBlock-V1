package service

import (
	"context"
	"encoding/json"
	"fmt"

	"sciblock/go-api/internal/domain"
	"sciblock/go-api/internal/repository"
)

// ExperimentService handles business logic for ExperimentRecord.
type ExperimentService struct {
	repo      repository.ExperimentRepository
	sciNotes  repository.SciNoteRepository
}

// NewExperimentService creates an ExperimentService.
func NewExperimentService(repo repository.ExperimentRepository, sciNotes repository.SciNoteRepository) *ExperimentService {
	return &ExperimentService{repo: repo, sciNotes: sciNotes}
}

// List returns all ExperimentRecords for a SciNote.
// When deleted is true, only soft-deleted records are returned (trash view).
func (s *ExperimentService) List(ctx context.Context, sciNoteID, callerUserID string, deleted bool) ([]domain.ExperimentRecord, error) {
	note, err := s.sciNotes.GetByID(ctx, sciNoteID)
	if err != nil {
		return nil, fmt.Errorf("get scinote: %w", err)
	}
	if note == nil {
		return nil, ErrNotFound
	}
	if note.UserID != callerUserID {
		return nil, ErrForbidden
	}

	records, err := s.repo.ListBySciNote(ctx, sciNoteID, deleted)
	if err != nil {
		return nil, fmt.Errorf("list experiments: %w", err)
	}
	return records, nil
}

// Get retrieves a single ExperimentRecord, verifying the caller owns the parent SciNote.
func (s *ExperimentService) Get(ctx context.Context, id, callerUserID string) (*domain.ExperimentRecord, error) {
	rec, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("get experiment: %w", err)
	}
	if rec == nil {
		return nil, ErrNotFound
	}

	note, err := s.sciNotes.GetByID(ctx, rec.SciNoteID)
	if err != nil {
		return nil, fmt.Errorf("get parent scinote: %w", err)
	}
	if note == nil || note.UserID != callerUserID {
		return nil, ErrForbidden
	}

	return rec, nil
}

// Create inserts a new ExperimentRecord under the given SciNote.
func (s *ExperimentService) Create(ctx context.Context, sciNoteID string, rec domain.ExperimentRecord, callerUserID string) (*domain.ExperimentRecord, error) {
	note, err := s.sciNotes.GetByID(ctx, sciNoteID)
	if err != nil || note == nil {
		return nil, ErrNotFound
	}
	if note.UserID != callerUserID {
		return nil, ErrForbidden
	}

	rec.SciNoteID = sciNoteID
	created, err := s.repo.Create(ctx, rec)
	if err != nil {
		return nil, fmt.Errorf("create experiment: %w", err)
	}
	return created, nil
}

// Update applies a partial patch to an ExperimentRecord.
func (s *ExperimentService) Update(ctx context.Context, id string, patch domain.ExperimentPatch, callerUserID string) (*domain.ExperimentRecord, error) {
	if _, err := s.Get(ctx, id, callerUserID); err != nil {
		return nil, err
	}
	updated, err := s.repo.Update(ctx, id, patch)
	if err != nil {
		return nil, fmt.Errorf("update experiment: %w", err)
	}
	return updated, nil
}

// UpdateModule merges an updated OntologyModule into the current_modules JSON array.
// The key parameter matches OntologyModuleKey ("system"|"preparation"|"operation"|"measurement"|"data").
func (s *ExperimentService) UpdateModule(ctx context.Context, id, key string, moduleJSON json.RawMessage, callerUserID string) error {
	rec, err := s.Get(ctx, id, callerUserID)
	if err != nil {
		return err
	}

	merged, err := mergeModule(rec.CurrentModules, key, moduleJSON)
	if err != nil {
		return fmt.Errorf("merge module: %w", err)
	}

	return s.repo.UpdateModules(ctx, id, merged)
}

// SoftDelete moves an ExperimentRecord to the trash (is_deleted=true).
func (s *ExperimentService) SoftDelete(ctx context.Context, id, callerUserID string) error {
	if _, err := s.Get(ctx, id, callerUserID); err != nil {
		return err
	}
	return s.repo.SoftDelete(ctx, id)
}

// Restore recovers a soft-deleted ExperimentRecord.
func (s *ExperimentService) Restore(ctx context.Context, id, callerUserID string) (*domain.ExperimentRecord, error) {
	if _, err := s.Get(ctx, id, callerUserID); err != nil {
		return nil, err
	}
	if err := s.repo.Restore(ctx, id); err != nil {
		return nil, fmt.Errorf("restore experiment: %w", err)
	}
	return s.Get(ctx, id, callerUserID)
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

// mergeModule finds the module with the matching key in the JSON array and
// replaces it with the new value.  If the key is not found, the new module
// is appended.
func mergeModule(current json.RawMessage, key string, updated json.RawMessage) (json.RawMessage, error) {
	if len(current) == 0 {
		return json.RawMessage(`[` + string(updated) + `]`), nil
	}

	var modules []json.RawMessage
	if err := json.Unmarshal(current, &modules); err != nil {
		return nil, fmt.Errorf("unmarshal modules: %w", err)
	}

	found := false
	for i, m := range modules {
		var partial struct {
			Key string `json:"key"`
		}
		if err := json.Unmarshal(m, &partial); err != nil {
			continue
		}
		if partial.Key == key {
			modules[i] = updated
			found = true
			break
		}
	}

	if !found {
		modules = append(modules, updated)
	}

	result, err := json.Marshal(modules)
	if err != nil {
		return nil, fmt.Errorf("marshal merged modules: %w", err)
	}
	return result, nil
}
