package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"sciblock/go-api/internal/domain"
	"sciblock/go-api/pkg/token"
)

// contextKey is the unexported type for context keys in this package.
type contextKey string

const claimsKey contextKey = "tokenClaims"

// RequireAuth returns middleware that validates a Bearer JWT in the
// Authorization header.  On failure it writes a 401 JSON response and stops
// the handler chain.  On success the parsed TokenClaims are injected into the
// request context for downstream handlers to read via ClaimsFromContext.
func RequireAuth(jwtSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
				writeUnauthorized(w, "Authentication required")
				return
			}

			tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
			claims, err := token.Verify(tokenStr, jwtSecret)
			if err != nil {
				writeUnauthorized(w, "Invalid or expired token")
				return
			}

			ctx := context.WithValue(r.Context(), claimsKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// ClaimsFromContext retrieves the TokenClaims injected by RequireAuth.
// Returns nil if the middleware was not applied (should never happen in
// properly registered routes).
func ClaimsFromContext(ctx context.Context) *domain.TokenClaims {
	v, _ := ctx.Value(claimsKey).(*domain.TokenClaims)
	return v
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func writeUnauthorized(w http.ResponseWriter, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	json.NewEncoder(w).Encode(map[string]string{
		"error":   "unauthorized",
		"message": message,
	})
}
