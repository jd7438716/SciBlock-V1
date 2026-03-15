package service

import (
	"context"
	"errors"
	"fmt"

	"sciblock/go-api/internal/domain"
	"sciblock/go-api/internal/repository"
)

// ErrNotFound is returned when a requested resource does not exist.
var ErrNotFound = errors.New("not found")

// ErrForbidden is returned when the caller does not own the resource.
var ErrForbidden = errors.New("forbidden")

// SciNoteService handles business logic for the SciNote resource.
type SciNoteService struct {
	repo repository.SciNoteRepository
}

// NewSciNoteService creates a SciNoteService.
func NewSciNoteService(repo repository.SciNoteRepository) *SciNoteService {
	return &SciNoteService{repo: repo}
}

// List returns all non-deleted SciNotes owned by the given user.
func (s *SciNoteService) List(ctx context.Context, userID string) ([]domain.SciNote, error) {
	notes, err := s.repo.ListByUser(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("list scinotes: %w", err)
	}
	return notes, nil
}

// Get returns a single SciNote, enforcing ownership.
func (s *SciNoteService) Get(ctx context.Context, id, callerUserID string) (*domain.SciNote, error) {
	note, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("get scinote: %w", err)
	}
	if note == nil {
		return nil, ErrNotFound
	}
	if note.UserID != callerUserID {
		return nil, ErrForbidden
	}
	return note, nil
}

// Create persists a new SciNote owned by callerUserID.
func (s *SciNoteService) Create(ctx context.Context, note domain.SciNote, callerUserID string) (*domain.SciNote, error) {
	note.UserID = callerUserID
	created, err := s.repo.Create(ctx, note)
	if err != nil {
		return nil, fmt.Errorf("create scinote: %w", err)
	}
	return created, nil
}

// Update applies a patch to an existing SciNote, enforcing ownership.
func (s *SciNoteService) Update(ctx context.Context, id string, patch domain.SciNotePatch, callerUserID string) (*domain.SciNote, error) {
	existing, err := s.Get(ctx, id, callerUserID)
	if err != nil {
		return nil, err
	}
	_ = existing

	updated, err := s.repo.Update(ctx, id, patch)
	if err != nil {
		return nil, fmt.Errorf("update scinote: %w", err)
	}
	return updated, nil
}

// Delete soft-deletes a SciNote, enforcing ownership.
func (s *SciNoteService) Delete(ctx context.Context, id, callerUserID string) error {
	if _, err := s.Get(ctx, id, callerUserID); err != nil {
		return err
	}
	if err := s.repo.SoftDelete(ctx, id); err != nil {
		return fmt.Errorf("soft delete scinote: %w", err)
	}
	return nil
}
