package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type pgxShareRepository struct {
	pool *pgxpool.Pool
}

// NewShareRepository returns a pgx-backed ShareRepository.
func NewShareRepository(pool *pgxpool.Pool) ShareRepository {
	return &pgxShareRepository{pool: pool}
}

// HasShareAccess checks whether a share record exists for the given
// (experiment_record, experimentID, userID) triplet.
func (r *pgxShareRepository) HasShareAccess(ctx context.Context, experimentID, userID string) (bool, error) {
	var exists bool
	err := r.pool.QueryRow(ctx,
		`SELECT EXISTS (
			SELECT 1 FROM shares
			WHERE resource_type = 'experiment_record'
			  AND resource_id   = $1
			  AND recipient_id  = $2
		)`,
		experimentID, userID,
	).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("HasShareAccess query: %w", err)
	}
	return exists, nil
}
