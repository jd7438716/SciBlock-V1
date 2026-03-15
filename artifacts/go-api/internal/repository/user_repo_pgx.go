package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"sciblock/go-api/internal/domain"
)

type pgxUserRepository struct {
	pool *pgxpool.Pool
}

// NewUserRepository returns a pgx-backed UserRepository.
func NewUserRepository(pool *pgxpool.Pool) UserRepository {
	return &pgxUserRepository{pool: pool}
}

const userColumns = `id, email, password_hash, name, COALESCE(role, 'student'), created_at`

// GetByEmail finds a user by email (case-insensitive).
// Returns nil, nil when no row matches.
func (r *pgxUserRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	row := r.pool.QueryRow(ctx,
		`SELECT `+userColumns+` FROM users WHERE lower(email) = lower($1) LIMIT 1`,
		strings.TrimSpace(email),
	)
	u, err := scanUser(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("GetByEmail: %w", err)
	}
	return u, nil
}

// GetByID finds a user by primary key.
// Returns nil, nil when no row matches.
func (r *pgxUserRepository) GetByID(ctx context.Context, id string) (*domain.User, error) {
	row := r.pool.QueryRow(ctx,
		`SELECT `+userColumns+` FROM users WHERE id = $1`,
		id,
	)
	u, err := scanUser(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("GetByID: %w", err)
	}
	return u, nil
}

// ---------------------------------------------------------------------------
// Scan helper
// ---------------------------------------------------------------------------

func scanUser(row pgx.Row) (*domain.User, error) {
	var (
		id           string
		email        string
		passwordHash string
		name         string
		role         string
		createdAt    time.Time
	)
	if err := row.Scan(&id, &email, &passwordHash, &name, &role, &createdAt); err != nil {
		return nil, err
	}
	return &domain.User{
		ID:           id,
		Email:        email,
		PasswordHash: passwordHash,
		Name:         name,
		Role:         domain.Role(role),
		CreatedAt:    createdAt,
	}, nil
}
