// Package domain contains the core business types for the Go API server.
//
// Rule: domain types must NOT import any framework or infrastructure package
// (no chi, no pgx, no net/http).  They are plain Go structs used by all layers.
package domain

import "time"

// Role represents the access level of a user in the system.
type Role string

const (
	RoleStudent    Role = "student"
	RoleInstructor Role = "instructor"
)

// User is the authenticated principal.
// PasswordHash is never returned to the client — only id/email/name/role are.
type User struct {
	ID           string
	Email        string
	PasswordHash string
	Name         string
	Role         Role
	CreatedAt    time.Time
}

// TokenClaims holds the data embedded inside a JWT.
// These fields are available to every handler via the request context after
// the RequireAuth middleware verifies the token.
type TokenClaims struct {
	UserID string
	Email  string
	Name   string
	Role   Role
}
