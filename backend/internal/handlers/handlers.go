// Package handlers implements the Kreach REST API endpoints on top of
// PocketBase's router. Every data handler is owner-scoped: records are always
// filtered and written against the authenticated user (e.Auth.Id), so a user
// can never read or mutate another user's data.
package handlers

import (
	"github.com/kreach/backend/internal/collections"
	"github.com/kreach/backend/internal/ratelimit"

	"github.com/pocketbase/pocketbase/core"
)

// Handlers bundles the dependencies shared by every endpoint.
type Handlers struct {
	App      core.App
	Throttle *ratelimit.Throttle
}

// New constructs a Handlers value.
func New(app core.App, throttle *ratelimit.Throttle) *Handlers {
	return &Handlers{App: app, Throttle: throttle}
}

// audit appends an audit_logs entry. Failures to write the audit trail are
// returned to the caller so they can decide whether to surface them; they
// never carry the request payload's secrets.
func (h *Handlers) audit(e *core.RequestEvent, action, resource, recipient string, details map[string]any) error {
	col, err := h.App.FindCollectionByNameOrId(collections.AuditLogs)
	if err != nil {
		return err
	}
	rec := core.NewRecord(col)
	rec.Set(collections.FieldUser, e.Auth.Id)
	rec.Set(collections.FieldAuditAction, action)
	rec.Set(collections.FieldAuditResource, resource)
	if recipient != "" {
		rec.Set(collections.FieldAuditRecipient, recipient)
	}
	rec.Set(collections.FieldAuditIP, e.RealIP())
	if details != nil {
		rec.Set(collections.FieldAuditDetails, details)
	}
	return h.App.Save(rec)
}

// requireOwned loads a record from the given collection and verifies it belongs
// to the authenticated user. It returns a NotFound API error when the record is
// missing or owned by someone else (we avoid leaking existence via 403).
func (h *Handlers) requireOwned(e *core.RequestEvent, collection, id, ownerField string) (*core.Record, error) {
	rec, err := h.App.FindRecordById(collection, id)
	if err != nil {
		return nil, e.NotFoundError("record not found", nil)
	}
	if rec.GetString(ownerField) != e.Auth.Id {
		return nil, e.NotFoundError("record not found", nil)
	}
	return rec, nil
}
