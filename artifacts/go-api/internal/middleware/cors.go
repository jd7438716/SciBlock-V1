// Package middleware provides HTTP middleware for the Go API server.
package middleware

import "net/http"

// CORS returns a middleware that adds permissive CORS headers.
//
// In development this allows all origins, which is required because the Replit
// proxy changes the effective origin of browser requests.
//
// TODO (Phase 2): accept a configurable CORS_ORIGINS env variable and restrict
// origins in production deployments.
func CORS() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-Id")

			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
