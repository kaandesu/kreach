package handlers

import (
	"strings"

	"github.com/kreach/backend/internal/collections"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
)

// ListSendLogs returns the authenticated user's email send logs, newest first.
// An optional ?recipient= query filters by recipient address.
func (h *Handlers) ListSendLogs(e *core.RequestEvent) error {
	filter := collections.FieldOwner + " = {:owner}"
	params := dbx.Params{"owner": e.Auth.Id}

	if recipient := strings.TrimSpace(e.Request.URL.Query().Get("recipient")); recipient != "" {
		filter += " && " + collections.FieldSendRecipient + " = {:recipient}"
		params["recipient"] = strings.ToLower(recipient)
	}

	records, err := h.App.FindRecordsByFilter(
		collections.SendLogs,
		filter,
		"-"+collections.FieldCreated,
		200, 0,
		params,
	)
	if err != nil {
		return e.InternalServerError("failed to list send logs", err)
	}
	return e.JSON(200, records)
}

// ListAuditLogs returns the authenticated user's audit trail, newest first.
// An optional ?recipient= query filters by recipient address.
func (h *Handlers) ListAuditLogs(e *core.RequestEvent) error {
	filter := collections.FieldUser + " = {:user}"
	params := dbx.Params{"user": e.Auth.Id}

	if recipient := strings.TrimSpace(e.Request.URL.Query().Get("recipient")); recipient != "" {
		filter += " && " + collections.FieldAuditRecipient + " = {:recipient}"
		params["recipient"] = strings.ToLower(recipient)
	}

	records, err := h.App.FindRecordsByFilter(
		collections.AuditLogs,
		filter,
		"-"+collections.FieldCreated,
		200, 0,
		params,
	)
	if err != nil {
		return e.InternalServerError("failed to list audit logs", err)
	}
	return e.JSON(200, records)
}
