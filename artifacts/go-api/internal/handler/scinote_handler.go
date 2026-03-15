package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"sciblock/go-api/internal/domain"
	"sciblock/go-api/internal/dto"
	"sciblock/go-api/internal/middleware"
	"sciblock/go-api/internal/service"
)

// SciNoteHandler handles /api/scinotes endpoints.
type SciNoteHandler struct {
	svc *service.SciNoteService
}

// NewSciNoteHandler creates a SciNoteHandler.
func NewSciNoteHandler(svc *service.SciNoteService) *SciNoteHandler {
	return &SciNoteHandler{svc: svc}
}

// List handles GET /api/scinotes.
func (h *SciNoteHandler) List(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	notes, err := h.svc.List(r.Context(), claims.UserID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "server_error", "Failed to list SciNotes")
		return
	}

	items := make([]dto.SciNoteResponse, len(notes))
	for i, n := range notes {
		items[i] = domainSciNoteToDTO(&n)
	}
	writeJSON(w, http.StatusOK, dto.ListSciNotesResponse{Items: items, Total: len(items)})
}

// Get handles GET /api/scinotes/:id.
func (h *SciNoteHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	claims := middleware.ClaimsFromContext(r.Context())

	note, err := h.svc.Get(r.Context(), id, claims.UserID)
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, domainSciNoteToDTO(note))
}

// Create handles POST /api/scinotes.
func (h *SciNoteHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req dto.CreateSciNoteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "Request body must be valid JSON")
		return
	}

	if req.Title == "" {
		writeError(w, http.StatusBadRequest, "validation_error", "title is required")
		return
	}
	if req.Kind == "" {
		req.Kind = "wizard"
	}

	claims := middleware.ClaimsFromContext(r.Context())
	note := domain.SciNote{
		Title:          req.Title,
		Kind:           req.Kind,
		ExperimentType: req.ExperimentType,
		Objective:      req.Objective,
		FormData:       req.FormData,
	}

	created, err := h.svc.Create(r.Context(), note, claims.UserID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "server_error", "Failed to create SciNote")
		return
	}
	writeJSON(w, http.StatusCreated, domainSciNoteToDTO(created))
}

// Update handles PATCH /api/scinotes/:id.
func (h *SciNoteHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	claims := middleware.ClaimsFromContext(r.Context())

	var req dto.UpdateSciNoteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "Request body must be valid JSON")
		return
	}

	patch := domain.SciNotePatch{
		Title:          req.Title,
		ExperimentType: req.ExperimentType,
		Objective:      req.Objective,
		FormData:       req.FormData,
	}

	updated, err := h.svc.Update(r.Context(), id, patch, claims.UserID)
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, domainSciNoteToDTO(updated))
}

// Delete handles DELETE /api/scinotes/:id (soft delete).
func (h *SciNoteHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	claims := middleware.ClaimsFromContext(r.Context())

	if err := h.svc.Delete(r.Context(), id, claims.UserID); err != nil {
		mapServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func domainSciNoteToDTO(n *domain.SciNote) dto.SciNoteResponse {
	return dto.SciNoteResponse{
		ID:             n.ID,
		UserID:         n.UserID,
		Title:          n.Title,
		Kind:           n.Kind,
		ExperimentType: n.ExperimentType,
		Objective:      n.Objective,
		FormData:       n.FormData,
		CreatedAt:      n.CreatedAt,
		UpdatedAt:      n.UpdatedAt,
	}
}

func mapServiceError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, service.ErrNotFound):
		writeError(w, http.StatusNotFound, "not_found", "Resource not found")
	case errors.Is(err, service.ErrForbidden):
		writeError(w, http.StatusForbidden, "forbidden", "Access denied")
	default:
		writeError(w, http.StatusInternalServerError, "server_error", "An unexpected error occurred")
	}
}
