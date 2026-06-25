package handlers

import (
	"strconv"
	"strings"
	"time"

	"github.com/kreach/backend/internal/collections"
	"github.com/kreach/backend/internal/email"
	"github.com/kreach/backend/internal/ratelimit"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
)

// pbDateTimeLayout matches how PocketBase persists datetime values, allowing
// lexicographic string comparison in filters.
const pbDateTimeLayout = "2006-01-02 15:04:05.000Z"

type sendEmailRequest struct {
	To           string `json:"to"`
	Subject      string `json:"subject"`
	HTML         string `json:"html"`
	ResendAPIKey string `json:"resend_api_key"`
	From         string `json:"from"`
	Template     string `json:"template"` // optional template id (for logging/relations)
	Project      string `json:"project"`  // optional project id (for logging/relations)
}

// SendEmail delivers an email through Resend using a caller-provided API key,
// enforces the per-user rate limits, and records both a send_log and an
// audit_log entry. The Resend key is never persisted.
func (h *Handlers) SendEmail(e *core.RequestEvent) error {
	var body sendEmailRequest
	if err := e.BindBody(&body); err != nil {
		return e.BadRequestError("invalid request body", err)
	}

	body.To = strings.TrimSpace(body.To)
	body.From = strings.TrimSpace(body.From)
	if body.To == "" || body.ResendAPIKey == "" {
		return e.BadRequestError("to and resend_api_key are required", nil)
	}
	if body.From == "" {
		return e.BadRequestError("from is required", nil)
	}
	if strings.TrimSpace(body.HTML) == "" {
		return e.BadRequestError("html body is required", nil)
	}

	// Optional relations must belong to the caller.
	if err := h.validateOwnedProject(e, body.Project); err != nil {
		return err
	}
	if body.Template != "" {
		if _, err := h.requireOwned(e, collections.Templates, body.Template, collections.FieldOwner); err != nil {
			return e.BadRequestError("template not found", nil)
		}
	}

	// ---- rate limit: >=600ms between sends -----------------------------
	previous := h.Throttle.LastSend(e.Auth.Id)
	if ok, retryAfter := h.Throttle.Allow(e.Auth.Id); !ok {
		e.Response.Header().Set("Retry-After", strconv.Itoa(int(retryAfter.Seconds())+1))
		return e.TooManyRequestsError("please wait at least 600ms between sends", nil)
	}

	// ---- rate limit: <=100 sends/day (authoritative DB count) ----------
	start := ratelimit.StartOfDayUTC(time.Now()).Format(pbDateTimeLayout)
	count, err := h.App.CountRecords(
		collections.SendLogs,
		dbx.NewExp(
			collections.FieldOwner+" = {:owner} AND "+collections.FieldCreated+" >= {:start}",
			dbx.Params{"owner": e.Auth.Id, "start": start},
		),
	)
	if err != nil {
		h.Throttle.Release(e.Auth.Id, previous)
		return e.InternalServerError("failed to check daily limit", err)
	}
	if count >= ratelimit.MaxPerDay {
		h.Throttle.Release(e.Auth.Id, previous) // attempt never went out
		return e.TooManyRequestsError("daily send limit reached (100/day)", nil)
	}

	// ---- deliver via Resend --------------------------------------------
	providerID, sendErr := email.Send(e.Request.Context(), body.ResendAPIKey, email.Message{
		From:    body.From,
		To:      body.To,
		Subject: body.Subject,
		HTML:    body.HTML,
	})

	// Always persist a send_log (sent or failed) and an audit entry.
	logRec := h.writeSendLog(e, body, providerID, sendErr)

	auditDetails := map[string]any{"status": collections.StatusSent}
	if sendErr != nil {
		auditDetails["status"] = collections.StatusFailed
	}
	if logRec != "" {
		auditDetails["send_log"] = logRec
	}
	_ = h.audit(e, collections.ActionEmailSend, logRec, body.To, auditDetails)

	if sendErr != nil {
		return e.InternalServerError("failed to send email", sendErr)
	}

	return e.JSON(200, map[string]any{
		"status":      collections.StatusSent,
		"provider_id": providerID,
		"send_log":    logRec,
	})
}

// writeSendLog records the outcome of a send attempt and returns the new
// send_logs record id (empty string if it could not be written). The Resend
// API key is deliberately absent from everything stored here.
func (h *Handlers) writeSendLog(e *core.RequestEvent, body sendEmailRequest, providerID string, sendErr error) string {
	col, err := h.App.FindCollectionByNameOrId(collections.SendLogs)
	if err != nil {
		return ""
	}
	rec := core.NewRecord(col)
	rec.Set(collections.FieldOwner, e.Auth.Id)
	rec.Set(collections.FieldSendRecipient, body.To)
	rec.Set(collections.FieldSendSubject, body.Subject)
	if body.Template != "" {
		rec.Set(collections.FieldSendTemplate, body.Template)
	}
	if body.Project != "" {
		rec.Set(collections.FieldSendProject, body.Project)
	}
	if sendErr != nil {
		rec.Set(collections.FieldSendStatus, collections.StatusFailed)
		rec.Set(collections.FieldSendError, sendErr.Error())
	} else {
		rec.Set(collections.FieldSendStatus, collections.StatusSent)
		rec.Set(collections.FieldSendProviderID, providerID)
	}
	if err := h.App.Save(rec); err != nil {
		return ""
	}
	return rec.Id
}
