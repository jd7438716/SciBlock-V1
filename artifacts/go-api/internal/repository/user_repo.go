// Package repository defines data-access interfaces and their pgx implementations.
//
// Rule: repository functions must return domain types, never raw database rows.
// Rule: repositories must NOT contain business logic — that belongs in service.
package repository

import (
	"context"

	"sciblock/go-api/internal/domain"
)

// UserRepository defines all database operations for the users table.
// The interface is defined here so that service code depends on the abstraction,
// not the concrete pgx implementation — enabling easy test doubles.
type UserRepository interface {
	// GetByEmail retrieves a user by email address (case-insensitive).
	// Returns nil, nil when not found.
	GetByEmail(ctx context.Context, email string) (*domain.User, error)

	// GetByID retrieves a user by primary key.
	// Returns nil, nil when not found.
	GetByID(ctx context.Context, id string) (*domain.User, error)
}

// TODO: implement pgxUserRepository once DB pool is injected into the handler chain.
// Skeleton:
//
//	type pgxUserRepository struct { pool *pgxpool.Pool }
//	func NewUserRepository(pool *pgxpool.Pool) UserRepository { ... }
//	func (r *pgxUserRepository) GetByEmail(...) (*domain.User, error) { ... }
//	func (r *pgxUserRepository) GetByID(...) (*domain.User, error) { ... }
