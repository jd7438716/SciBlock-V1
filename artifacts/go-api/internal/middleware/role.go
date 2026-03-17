package middleware

import (
	"encoding/json"
	"net/http"

	"sciblock/go-api/internal/domain"
)

// RequireInstructor is a middleware that enforces the instructor role.
// It MUST be used after RequireAuth — it relies on TokenClaims already
// being present in the request context.
//
// Responds 403 Forbidden when the caller is not an instructor.
func RequireInstructor(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims := ClaimsFromContext(r.Context())
		if claims == nil || claims.Role != domain.RoleInstructor {
			writeForbidden(w, "instructor role required")
			return
		}
		next.ServeHTTP(w, r)
	})
}

func writeForbidden(w http.ResponseWriter, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusForbidden)
	json.NewEncoder(w).Encode(map[string]string{ //nolint:errcheck
		"error":   "forbidden",
		"message": message,
	})
}
