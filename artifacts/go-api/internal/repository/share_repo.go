package repository

import "context"

// ShareRepository defines read operations against the shares table.
//
// Only read access is needed here — write operations (create/revoke) are
// managed exclusively by the Express API.  The Go API queries this table
// solely to decide whether a caller has been granted read access to an
// experiment record that they do not own.
type ShareRepository interface {
	// HasShareAccess reports whether userId has been granted access to the
	// experiment record identified by experimentID via a share record.
	// resourceType is always "experiment_record" for Go API callers.
	HasShareAccess(ctx context.Context, experimentID, userID string) (bool, error)
}
