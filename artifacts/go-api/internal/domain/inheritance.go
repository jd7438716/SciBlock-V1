package domain

import "encoding/json"

// ---------------------------------------------------------------------------
// Heritable module types — the canonical white-list of module keys that
// participate in the inheritance chain.
//
// Only modules with these keys are copied into scinotes.initial_modules
// and scinotes.current_confirmed_modules.  All other module keys (e.g. "data")
// are excluded from the inheritance chain and must never be added here
// without an explicit product decision.
// ---------------------------------------------------------------------------

// HeritableModuleKeys is the ordered set of module keys that enter the
// inheritance chain.  Order is preserved when extracting.
var HeritableModuleKeys = []string{
	"system",
	"preparation",
	"operation",
	"measurement",
}

// heritableKeySet is a lookup map built once for O(1) membership tests.
var heritableKeySet = func() map[string]bool {
	m := make(map[string]bool, len(HeritableModuleKeys))
	for _, k := range HeritableModuleKeys {
		m[k] = true
	}
	return m
}()

// ---------------------------------------------------------------------------
// ConfirmationState — the three-state lifecycle of an ExperimentRecord.
//
// draft          — created, never confirmed.
// confirmed      — user has clicked "confirm save" at least once; this record
//                  has contributed to (or is eligible to contribute to) the
//                  SciNote's current_confirmed_modules.
// confirmed_dirty — confirmed at some point, but current_modules has since
//                   diverged from confirmed_modules; requires a re-confirm to
//                   advance the inheritance chain again.
// ---------------------------------------------------------------------------

type ConfirmationState = string

const (
	Statedraft          ConfirmationState = "draft"
	StateConfirmed      ConfirmationState = "confirmed"
	StateConfirmedDirty ConfirmationState = "confirmed_dirty"
)

// ---------------------------------------------------------------------------
// DerivedFromSourceType — distinguishes whether a new record's defaults came
// from the SciNote's immutable initial_modules or from the last confirmed record.
// ---------------------------------------------------------------------------

type DerivedFromSourceType = string

const (
	SourceInitial DerivedFromSourceType = "initial"
	SourceRecord  DerivedFromSourceType = "record"
)

// ---------------------------------------------------------------------------
// ExtractHeritableModules filters a raw OntologyModule[] JSON blob, keeping
// only the modules whose "key" field is in HeritableModuleKeys.
//
// The function operates entirely at the JSON level — it never fully parses
// the rich module structure.  This keeps the Go backend decoupled from the
// frontend module schema while still enforcing the white-list boundary.
//
// Returns nil when modules is nil or contains no heritable entries.
// ---------------------------------------------------------------------------

func ExtractHeritableModules(modules json.RawMessage) (json.RawMessage, error) {
	if len(modules) == 0 {
		return nil, nil
	}

	var raw []json.RawMessage
	if err := json.Unmarshal(modules, &raw); err != nil {
		return nil, err
	}

	// We only need to inspect the "key" field of each element.
	type keyOnly struct {
		Key string `json:"key"`
	}

	var filtered []json.RawMessage
	for _, elem := range raw {
		var k keyOnly
		if err := json.Unmarshal(elem, &k); err != nil {
			continue
		}
		if heritableKeySet[k.Key] {
			filtered = append(filtered, elem)
		}
	}

	if len(filtered) == 0 {
		return nil, nil
	}

	out, err := json.Marshal(filtered)
	if err != nil {
		return nil, err
	}
	return out, nil
}

// MergeHeritableModules merges inheritedHeritable (the heritable modules from
// the previous context) into baseModules (a full OntologyModule[] from the
// request), replacing any heritable-keyed module in base with the inherited
// version.  Non-heritable modules (e.g. "data") are kept from base unchanged.
//
// If inheritedHeritable is nil, baseModules is returned as-is.
// If baseModules is nil or empty, inheritedHeritable is returned directly.
func MergeHeritableModules(baseModules, inheritedHeritable json.RawMessage) (json.RawMessage, error) {
	if len(inheritedHeritable) == 0 {
		return baseModules, nil
	}
	if len(baseModules) == 0 {
		return inheritedHeritable, nil
	}

	type keyOnly struct {
		Key string `json:"key"`
	}

	var inherited []json.RawMessage
	if err := json.Unmarshal(inheritedHeritable, &inherited); err != nil {
		return baseModules, nil
	}

	// Build map: heritable key → raw JSON element
	inheritedMap := make(map[string]json.RawMessage, len(inherited))
	for _, elem := range inherited {
		var k keyOnly
		if err := json.Unmarshal(elem, &k); err != nil {
			continue
		}
		inheritedMap[k.Key] = elem
	}

	var base []json.RawMessage
	if err := json.Unmarshal(baseModules, &base); err != nil {
		return baseModules, nil
	}

	merged := make([]json.RawMessage, 0, len(base))
	seenKeys := make(map[string]bool)

	for _, elem := range base {
		var k keyOnly
		if err := json.Unmarshal(elem, &k); err != nil {
			merged = append(merged, elem)
			continue
		}
		seenKeys[k.Key] = true
		if rep, ok := inheritedMap[k.Key]; ok {
			merged = append(merged, rep)
		} else {
			merged = append(merged, elem)
		}
	}

	// Append any heritable modules that were NOT in base (e.g. base was empty)
	for _, k := range HeritableModuleKeys {
		if !seenKeys[k] {
			if rep, ok := inheritedMap[k]; ok {
				merged = append(merged, rep)
			}
		}
	}

	out, err := json.Marshal(merged)
	if err != nil {
		return baseModules, nil
	}
	return out, nil
}
