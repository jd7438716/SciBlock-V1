package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"sciblock/go-api/internal/domain"
	"sciblock/go-api/internal/dto"
	"sciblock/go-api/internal/middleware"
	"sciblock/go-api/internal/service"
)

// ExperimentHandler handles ExperimentRecord endpoints.
type ExperimentHandler struct {
	svc *service.ExperimentService
}

// NewExperimentHandler creates an ExperimentHandler.
func NewExperimentHandler(svc *service.ExperimentService) *ExperimentHandler {
	return &ExperimentHandler{svc: svc}
}

// ListBySciNote handles GET /api/scinotes/:id/records.
func (h *ExperimentHandler) ListBySciNote(w http.ResponseWriter, r *http.Request) {
	sciNoteID := chi.URLParam(r, "id")
	claims := middleware.ClaimsFromContext(r.Context())
	deleted := r.URL.Query().Get("deleted") == "true"

	records, err := h.svc.List(r.Context(), sciNoteID, claims.UserID, deleted)
	if err != nil {
		mapServiceError(w, err)
		return
	}

	items := make([]dto.ExperimentResponse, len(records))
	for i, rec := range records {
		items[i] = domainExpToDTO(&rec)
	}
	writeJSON(w, http.StatusOK, dto.ListExperimentsResponse{Items: items, Total: len(items)})
}

// Create handles POST /api/scinotes/:id/records.
func (h *ExperimentHandler) Create(w http.ResponseWriter, r *http.Request) {
	sciNoteID := chi.URLParam(r, "id")
	claims := middleware.ClaimsFromContext(r.Context())

	var req dto.CreateExperimentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "Request body must be valid JSON")
		return
	}
	if req.Title == "" {
		writeError(w, http.StatusBadRequest, "validation_error", "title is required")
		return
	}
	if req.ExperimentStatus == "" {
		req.ExperimentStatus = domain.StatusExploring
	}

	rec := domain.ExperimentRecord{
		Title:              req.Title,
		PurposeInput:       req.PurposeInput,
		ExperimentStatus:   req.ExperimentStatus,
		ExperimentCode:     req.ExperimentCode,
		Tags:               req.Tags,
		CurrentModules:     req.CurrentModules,
		InheritedVersionID: req.InheritedVersionID,
	}
	if rec.Tags == nil {
		rec.Tags = []string{}
	}

	created, err := h.svc.Create(r.Context(), sciNoteID, rec, claims.UserID)
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, domainExpToDTO(created))
}

// Get handles GET /api/experiments/:id.
func (h *ExperimentHandler) Get(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	claims := middleware.ClaimsFromContext(r.Context())

	rec, err := h.svc.Get(r.Context(), id, claims.UserID)
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, domainExpToDTO(rec))
}

// Update handles PATCH /api/experiments/:id.
func (h *ExperimentHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	claims := middleware.ClaimsFromContext(r.Context())

	var req dto.UpdateExperimentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "Request body must be valid JSON")
		return
	}

	patch := domain.ExperimentPatch{
		Title:            req.Title,
		ExperimentStatus: req.ExperimentStatus,
		ExperimentCode:   req.ExperimentCode,
		Tags:             req.Tags,
		EditorContent:    req.EditorContent,
		ReportHtml:       req.ReportHtml,
	}

	updated, err := h.svc.Update(r.Context(), id, patch, claims.UserID)
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, domainExpToDTO(updated))
}

// UpdateModule handles PATCH /api/experiments/:id/modules/:key.
func (h *ExperimentHandler) UpdateModule(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	key := chi.URLParam(r, "key")
	claims := middleware.ClaimsFromContext(r.Context())

	var req dto.UpdateModuleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "Request body must be valid JSON")
		return
	}
	if len(req.Module) == 0 {
		writeError(w, http.StatusBadRequest, "validation_error", "module is required")
		return
	}

	if err := h.svc.UpdateModule(r.Context(), id, key, req.Module, claims.UserID); err != nil {
		mapServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// SoftDelete handles DELETE /api/experiments/:id.
func (h *ExperimentHandler) SoftDelete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	claims := middleware.ClaimsFromContext(r.Context())

	if err := h.svc.SoftDelete(r.Context(), id, claims.UserID); err != nil {
		mapServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// Restore handles PATCH /api/experiments/:id/restore.
func (h *ExperimentHandler) Restore(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	claims := middleware.ClaimsFromContext(r.Context())

	restored, err := h.svc.Restore(r.Context(), id, claims.UserID)
	if err != nil {
		mapServiceError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, domainExpToDTO(restored))
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func domainExpToDTO(rec *domain.ExperimentRecord) dto.ExperimentResponse {
	tags := rec.Tags
	if tags == nil {
		tags = []string{}
	}
	return dto.ExperimentResponse{
		ID:                 rec.ID,
		SciNoteID:          rec.SciNoteID,
		Title:              rec.Title,
		PurposeInput:       rec.PurposeInput,
		ExperimentStatus:   rec.ExperimentStatus,
		ExperimentCode:     rec.ExperimentCode,
		Tags:               tags,
		EditorContent:      rec.EditorContent,
		ReportHtml:         rec.ReportHtml,
		CurrentModules:     rec.CurrentModules,
		InheritedVersionID: rec.InheritedVersionID,
		IsDeleted:          rec.IsDeleted,
		CreatedAt:          rec.CreatedAt,
		UpdatedAt:          rec.UpdatedAt,
	}
}
