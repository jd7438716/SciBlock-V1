// Package handler contains HTTP handlers.
//
// Rules:
//   - Handlers must only call service methods — never repository or db directly.
//   - Handlers decode request bodies, call service, encode responses.
//   - All error mapping (service error → HTTP status) lives here.
package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"sciblock/go-api/internal/domain"
	"sciblock/go-api/internal/dto"
	"sciblock/go-api/internal/middleware"
	"sciblock/go-api/internal/service"
)

// AuthHandler handles auth-related HTTP endpoints.
type AuthHandler struct {
	auth *service.AuthService
}

// NewAuthHandler creates an AuthHandler.
func NewAuthHandler(auth *service.AuthService) *AuthHandler {
	return &AuthHandler{auth: auth}
}

// Login handles POST /api/auth/login.
// On success returns a JWT token + user DTO.
// On bad credentials returns 401.
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req dto.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "Request body must be valid JSON")
		return
	}

	result, err := h.auth.Login(r.Context(), req.Email, req.Password)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			writeError(w, http.StatusUnauthorized, "invalid_credentials", "Invalid email or password")
			return
		}
		writeError(w, http.StatusInternalServerError, "server_error", "An unexpected error occurred")
		return
	}

	writeJSON(w, http.StatusOK, dto.LoginResponse{
		Token: result.Token,
		User:  domainUserToDTO(result.User),
	})
}

// Me handles GET /api/auth/me — requires RequireAuth middleware.
// Returns the user record associated with the JWT token.
func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r.Context())
	if claims == nil {
		writeError(w, http.StatusUnauthorized, "unauthorized", "Authentication required")
		return
	}

	user, err := h.auth.Me(r.Context(), claims.UserID)
	if err != nil {
		writeError(w, http.StatusNotFound, "not_found", "User not found")
		return
	}

	writeJSON(w, http.StatusOK, domainUserToDTO(user))
}

// Logout handles POST /api/auth/logout.
// JWTs are stateless — logout is handled client-side by deleting the token.
// This endpoint exists so the frontend has a clean call to make on logout,
// and so server-side session invalidation can be added here later (e.g.
// a token denylist in Redis) without frontend changes.
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"message": "Logged out"})
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

func domainUserToDTO(u *domain.User) dto.UserDTO {
	return dto.UserDTO{
		ID:    u.ID,
		Email: u.Email,
		Name:  u.Name,
		Role:  string(u.Role),
	}
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, map[string]string{
		"error":   code,
		"message": message,
	})
}
