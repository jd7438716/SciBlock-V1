package db

import "embed"

// MigrationsFS embeds all goose SQL migration files.
// The embed directive must live in the same package as the migrations directory.
//
//go:embed migrations/*.sql
var MigrationsFS embed.FS
