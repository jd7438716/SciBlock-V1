// Package dto contains HTTP request and response types.
//
// Rules:
//   - DTO structs must NOT embed domain structs directly.
//   - Conversion between domain <-> DTO happens in the handler layer.
//   - DTO structs may have JSON tags and validation tags.
//   - DTO structs must NOT import repository or service packages.
package dto

// LoginRequest is the JSON body for POST /api/auth/login.
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// UserDTO is the public representation of a user (no password hash).
type UserDTO struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
	Role  string `json:"role"`
}

// LoginResponse is returned on a successful login.
// Compared to the Express version, this response adds the `token` field.
// The frontend useLogin hook checks for this field: if present it stores the
// JWT; if absent it falls back to the legacy behaviour.
type LoginResponse struct {
	Token string  `json:"token"`
	User  UserDTO `json:"user"`
}

// MeResponse mirrors LoginResponse.User — reuse UserDTO directly.
type MeResponse = UserDTO
