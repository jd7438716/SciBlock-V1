package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"sciblock/go-api/internal/domain"
)

type pgxSciNoteRepository struct {
	pool *pgxpool.Pool
}

// NewSciNoteRepository returns a pgx-backed SciNoteRepository.
func NewSciNoteRepository(pool *pgxpool.Pool) SciNoteRepository {
	return &pgxSciNoteRepository{pool: pool}
}

const sciNoteColumns = `
        id, user_id, title, kind,
        experiment_type, objective, form_data,
        is_deleted, created_at, updated_at,
        initial_modules, current_confirmed_modules, context_version,
        last_confirmed_record_id, last_confirmed_record_seq`

// ListByUser returns all non-deleted SciNotes owned by userID, newest first.
func (r *pgxSciNoteRepository) ListByUser(ctx context.Context, userID string) ([]domain.SciNote, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT`+sciNoteColumns+`
                 FROM scinotes
                 WHERE user_id = $1 AND is_deleted = false
                 ORDER BY updated_at DESC`,
		userID,
	)
	if err != nil {
		return nil, fmt.Errorf("ListByUser query: %w", err)
	}
	defer rows.Close()

	var notes []domain.SciNote
	for rows.Next() {
		n, err := scanSciNote(rows)
		if err != nil {
			return nil, fmt.Errorf("ListByUser scan: %w", err)
		}
		notes = append(notes, *n)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("ListByUser rows: %w", err)
	}
	if notes == nil {
		notes = []domain.SciNote{}
	}
	return notes, nil
}

// GetByID retrieves a SciNote by primary key regardless of is_deleted status.
// Returns nil, nil when not found.
func (r *pgxSciNoteRepository) GetByID(ctx context.Context, id string) (*domain.SciNote, error) {
	row := r.pool.QueryRow(ctx,
		`SELECT`+sciNoteColumns+`
                 FROM scinotes WHERE id = $1`,
		id,
	)
	n, err := scanSciNote(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("GetByID: %w", err)
	}
	return n, nil
}

// Create inserts a new SciNote and returns the persisted row.
func (r *pgxSciNoteRepository) Create(ctx context.Context, note domain.SciNote) (*domain.SciNote, error) {
	row := r.pool.QueryRow(ctx,
		`INSERT INTO scinotes
                        (id, user_id, title, kind, experiment_type, objective, form_data, initial_modules)
                 VALUES
                        (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
                 RETURNING`+sciNoteColumns,
		note.UserID,
		note.Title,
		note.Kind,
		note.ExperimentType,
		note.Objective,
		nullableJSON(note.FormData),
		nullableJSON(note.InitialModules),
	)
	n, err := scanSciNote(row)
	if err != nil {
		return nil, fmt.Errorf("Create: %w", err)
	}
	return n, nil
}

// Update applies a partial patch; only non-nil fields are written.
func (r *pgxSciNoteRepository) Update(ctx context.Context, id string, patch domain.SciNotePatch) (*domain.SciNote, error) {
	setClauses := []string{"updated_at = now()"}
	args := []any{}
	argIdx := 1

	if patch.Title != nil {
		setClauses = append(setClauses, fmt.Sprintf("title = $%d", argIdx))
		args = append(args, *patch.Title)
		argIdx++
	}
	if patch.ExperimentType != nil {
		setClauses = append(setClauses, fmt.Sprintf("experiment_type = $%d", argIdx))
		args = append(args, *patch.ExperimentType)
		argIdx++
	}
	if patch.Objective != nil {
		setClauses = append(setClauses, fmt.Sprintf("objective = $%d", argIdx))
		args = append(args, *patch.Objective)
		argIdx++
	}
	if len(patch.FormData) > 0 {
		setClauses = append(setClauses, fmt.Sprintf("form_data = $%d", argIdx))
		args = append(args, []byte(patch.FormData))
		argIdx++
	}

	if len(setClauses) == 1 {
		// Only updated_at — nothing really changed; just return current row.
		return r.GetByID(ctx, id)
	}

	args = append(args, id)
	query := fmt.Sprintf(
		`UPDATE scinotes SET %s WHERE id = $%d RETURNING`+sciNoteColumns,
		strings.Join(setClauses, ", "),
		argIdx,
	)

	row := r.pool.QueryRow(ctx, query, args...)
	n, err := scanSciNote(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("Update: %w", err)
	}
	return n, nil
}

// SoftDelete sets is_deleted=true.
func (r *pgxSciNoteRepository) SoftDelete(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE scinotes SET is_deleted = true, updated_at = now() WHERE id = $1`,
		id,
	)
	if err != nil {
		return fmt.Errorf("SoftDelete: %w", err)
	}
	return nil
}

// SetInitialModules writes initial_modules ONLY when it is currently NULL.
// Subsequent calls are no-ops that return the current row unchanged.
func (r *pgxSciNoteRepository) SetInitialModules(ctx context.Context, id string, modules json.RawMessage) (*domain.SciNote, error) {
	row := r.pool.QueryRow(ctx,
		`UPDATE scinotes
                 SET initial_modules = $1, updated_at = now()
                 WHERE id = $2 AND initial_modules IS NULL
                 RETURNING`+sciNoteColumns,
		[]byte(modules), id,
	)
	n, err := scanSciNote(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			// Already set — return current row without modification.
			return r.GetByID(ctx, id)
		}
		return nil, fmt.Errorf("SetInitialModules: %w", err)
	}
	return n, nil
}

// AdvanceContext atomically updates current_confirmed_modules, bumps context_version,
// and records which record triggered the advance.
// Returns the new context_version.
func (r *pgxSciNoteRepository) AdvanceContext(
	ctx context.Context,
	id string,
	newModules json.RawMessage,
	lastRecordID string,
	lastRecordSeq int,
) (int, error) {
	var newVersion int
	err := r.pool.QueryRow(ctx,
		`UPDATE scinotes
                 SET current_confirmed_modules = $1,
                     context_version           = context_version + 1,
                     last_confirmed_record_id  = $2,
                     last_confirmed_record_seq = $3,
                     updated_at               = now()
                 WHERE id = $4
                 RETURNING context_version`,
		[]byte(newModules), lastRecordID, lastRecordSeq, id,
	).Scan(&newVersion)
	if err != nil {
		return 0, fmt.Errorf("AdvanceContext: %w", err)
	}
	return newVersion, nil
}

// ---------------------------------------------------------------------------
// Scan helpers
// ---------------------------------------------------------------------------

// sciNoteScanner covers both pgx.Row and pgx.Rows.
type sciNoteScanner interface {
	Scan(dest ...any) error
}

func scanSciNote(row sciNoteScanner) (*domain.SciNote, error) {
	var (
		id                      string
		userID                  string
		title                   string
		kind                    string
		experimentType          *string
		objective               *string
		formData                []byte
		isDeleted               bool
		createdAt               time.Time
		updatedAt               time.Time
		initialModules          []byte
		currentConfirmedModules []byte
		contextVersion          int
		lastConfirmedRecordID   *string
		lastConfirmedRecordSeq  *int
	)
	if err := row.Scan(
		&id, &userID, &title, &kind,
		&experimentType, &objective, &formData,
		&isDeleted, &createdAt, &updatedAt,
		&initialModules, &currentConfirmedModules, &contextVersion,
		&lastConfirmedRecordID, &lastConfirmedRecordSeq,
	); err != nil {
		return nil, err
	}
	return &domain.SciNote{
		ID:                      id,
		UserID:                  userID,
		Title:                   title,
		Kind:                    kind,
		ExperimentType:          experimentType,
		Objective:               objective,
		FormData:                jsonOrNil(formData),
		IsDeleted:               isDeleted,
		CreatedAt:               createdAt,
		UpdatedAt:               updatedAt,
		InitialModules:          jsonOrNil(initialModules),
		CurrentConfirmedModules: jsonOrNil(currentConfirmedModules),
		ContextVersion:          contextVersion,
		LastConfirmedRecordID:   lastConfirmedRecordID,
		LastConfirmedRecordSeq:  lastConfirmedRecordSeq,
	}, nil
}
