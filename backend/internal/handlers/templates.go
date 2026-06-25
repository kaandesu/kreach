package handlers

import (
	"strings"

	"github.com/kreach/backend/internal/collections"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
)

type templateRequest struct {
	Name     *string `json:"name"`
	Subject  *string `json:"subject"`
	Body     *string `json:"body"`
	HTML     *string `json:"html"`
	Project  *string `json:"project"` // optional project id
	Model    *string `json:"model"`
	Prompt   *string `json:"prompt"`
	Selected *bool   `json:"selected"`
}

// ListTemplates returns the authenticated user's templates, newest first.
func (h *Handlers) ListTemplates(e *core.RequestEvent) error {
	filter := collections.FieldOwner + " = {:owner}"
	params := dbx.Params{"owner": e.Auth.Id}
	if project := strings.TrimSpace(e.Request.URL.Query().Get("project")); project != "" {
		filter += " && " + collections.FieldTemplateProject + " = {:project}"
		params["project"] = project
	}

	records, err := h.App.FindRecordsByFilter(
		collections.Templates,
		filter,
		"-"+collections.FieldCreated,
		200, 0,
		params,
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
	html := body.HTML
	if html == nil {
		html = body.Body
	}
	if body.Name == nil || strings.TrimSpace(*body.Name) == "" || html == nil || strings.TrimSpace(*html) == "" {
		return e.BadRequestError("name and html are required", nil)
	}
	project := ""
	if body.Project != nil {
		project = *body.Project
	}
	if err := h.validateOwnedProject(e, project); err != nil {
		return err
	}

	col, err := h.App.FindCollectionByNameOrId(collections.Templates)
	if err != nil {
		return e.InternalServerError("templates collection unavailable", err)
	}

	rec := core.NewRecord(col)
	rec.Set(collections.FieldName, *body.Name)
	if body.Subject != nil {
		rec.Set(collections.FieldTemplateSubject, *body.Subject)
	}
	rec.Set(collections.FieldTemplateBody, *html)
	rec.Set(collections.FieldOwner, e.Auth.Id)
	if project != "" {
		rec.Set(collections.FieldTemplateProject, project)
	}
	if body.Model != nil {
		rec.Set(collections.FieldTemplateModel, *body.Model)
	}
	if body.Prompt != nil {
		rec.Set(collections.FieldTemplatePrompt, *body.Prompt)
	}
	if body.Selected != nil {
		rec.Set(collections.FieldTemplateSelected, *body.Selected)
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
	if body.Project != nil {
		if err := h.validateOwnedProject(e, *body.Project); err != nil {
			return err
		}
	}

	if body.Name != nil && *body.Name != "" {
		rec.Set(collections.FieldName, *body.Name)
	}
	if body.Subject != nil {
		rec.Set(collections.FieldTemplateSubject, *body.Subject)
	}
	html := body.HTML
	if html == nil {
		html = body.Body
	}
	if html != nil && *html != "" {
		rec.Set(collections.FieldTemplateBody, *html)
	}
	if body.Project != nil {
		rec.Set(collections.FieldTemplateProject, *body.Project)
	}
	if body.Model != nil {
		rec.Set(collections.FieldTemplateModel, *body.Model)
	}
	if body.Prompt != nil {
		rec.Set(collections.FieldTemplatePrompt, *body.Prompt)
	}
	if body.Selected != nil {
		rec.Set(collections.FieldTemplateSelected, *body.Selected)
	}

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
