package repository

import "encoding/json"

// nullableJSON converts a json.RawMessage to a *[]byte suitable for pgx.
// A nil or empty RawMessage becomes nil (SQL NULL).
func nullableJSON(raw json.RawMessage) any {
	if len(raw) == 0 {
		return nil
	}
	b := []byte(raw)
	return b
}

// jsonOrNil converts a []byte scanned from a jsonb column into json.RawMessage.
// Empty or NULL bytes become nil.
func jsonOrNil(b []byte) json.RawMessage {
	if len(b) == 0 {
		return nil
	}
	return json.RawMessage(b)
}
