package handlers

import (
	"strings"

	"github.com/kreach/backend/internal/collections"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
)

type templateRequest struct {
	Name    string `json:"name"`
	Subject string `json:"subject"`
	Body    string `json:"body"`
	Project string `json:"project"` // optional project id
}

// ListTemplates returns the authenticated user's templates, newest first.
func (h *Handlers) ListTemplates(e *core.RequestEvent) error {
	records, err := h.App.FindRecordsByFilter(
		collections.Templates,
		collections.FieldOwner+" = {:owner}",
		"-"+collections.FieldCreated,
		200, 0,
		dbx.Params{"owner": e.Auth.Id},
	)
	if err != nil {
		return e.InternalServerError("failed to list templates", err)
	}
	return e.JSON(200, records)
}

// CreateTemplate stores a new email template owned by the authenticated user.
func (h *Handlers) CreateTemplate(e *core.RequestEvent) error {
	var body templateRequest
	if err := e.BindBody(&body); err != nil {
		return e.BadRequestError("invalid request body", err)
	}
	if strings.TrimSpace(body.Name) == "" || strings.TrimSpace(body.Body) == "" {
		return e.BadRequestError("name and body are required", nil)
	}
	if err := h.validateOwnedProject(e, body.Project); err != nil {
		return err
	}

	col, err := h.App.FindCollectionByNameOrId(collections.Templates)
	if err != nil {
		return e.InternalServerError("templates collection unavailable", err)
	}

	rec := core.NewRecord(col)
	rec.Set(collections.FieldName, body.Name)
	rec.Set(collections.FieldTemplateSubject, body.Subject)
	rec.Set(collections.FieldTemplateBody, body.Body)
	rec.Set(collections.FieldOwner, e.Auth.Id)
	if body.Project != "" {
		rec.Set(collections.FieldTemplateProject, body.Project)
	}

	if err := h.App.Save(rec); err != nil {
		return e.BadRequestError("failed to create template", err)
	}

	_ = h.audit(e, collections.ActionTemplateCreate, rec.Id, "", nil)
	return e.JSON(201, rec)
}

// GetTemplate returns a single owned template.
func (h *Handlers) GetTemplate(e *core.RequestEvent) error {
	rec, err := h.requireOwned(e, collections.Templates, e.Request.PathValue("id"), collections.FieldOwner)
	if err != nil {
		return err
	}
	return e.JSON(200, rec)
}

// UpdateTemplate updates an owned template.
func (h *Handlers) UpdateTemplate(e *core.RequestEvent) error {
	rec, err := h.requireOwned(e, collections.Templates, e.Request.PathValue("id"), collections.FieldOwner)
	if err != nil {
		return err
	}

	var body templateRequest
	if err := e.BindBody(&body); err != nil {
		return e.BadRequestError("invalid request body", err)
	}
	if err := h.validateOwnedProject(e, body.Project); err != nil {
		return err
	}

	if body.Name != "" {
		rec.Set(collections.FieldName, body.Name)
	}
	rec.Set(collections.FieldTemplateSubject, body.Subject)
	if body.Body != "" {
		rec.Set(collections.FieldTemplateBody, body.Body)
	}
	rec.Set(collections.FieldTemplateProject, body.Project)

	if err := h.App.Save(rec); err != nil {
		return e.BadRequestError("failed to update template", err)
	}

	_ = h.audit(e, collections.ActionTemplateUpdate, rec.Id, "", nil)
	return e.JSON(200, rec)
}

// DeleteTemplate deletes an owned template.
func (h *Handlers) DeleteTemplate(e *core.RequestEvent) error {
	rec, err := h.requireOwned(e, collections.Templates, e.Request.PathValue("id"), collections.FieldOwner)
	if err != nil {
		return err
	}
	if err := h.App.Delete(rec); err != nil {
		return e.InternalServerError("failed to delete template", err)
	}
	_ = h.audit(e, collections.ActionTemplateDelete, rec.Id, "", nil)
	return e.NoContent(204)
}

// validateOwnedProject ensures that a referenced project (if any) belongs to
// the authenticated user, preventing cross-user relation references.
func (h *Handlers) validateOwnedProject(e *core.RequestEvent, projectID string) error {
	if projectID == "" {
		return nil
	}
	if _, err := h.requireOwned(e, collections.Projects, projectID, collections.FieldOwner); err != nil {
		return e.BadRequestError("project not found", nil)
	}
	return nil
}
