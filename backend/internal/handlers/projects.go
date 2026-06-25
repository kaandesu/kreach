package handlers

import (
	"strings"

	"github.com/kreach/backend/internal/collections"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
)

type projectRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

// ListProjects returns the authenticated user's projects, newest first.
func (h *Handlers) ListProjects(e *core.RequestEvent) error {
	records, err := h.App.FindRecordsByFilter(
		collections.Projects,
		collections.FieldOwner+" = {:owner}",
		"-"+collections.FieldCreated,
		200, 0,
		dbx.Params{"owner": e.Auth.Id},
	)
	if err != nil {
		return e.InternalServerError("failed to list projects", err)
	}
	return e.JSON(200, records)
}

// CreateProject creates a project owned by the authenticated user.
func (h *Handlers) CreateProject(e *core.RequestEvent) error {
	var body projectRequest
	if err := e.BindBody(&body); err != nil {
		return e.BadRequestError("invalid request body", err)
	}
	if strings.TrimSpace(body.Name) == "" {
		return e.BadRequestError("name is required", nil)
	}

	col, err := h.App.FindCollectionByNameOrId(collections.Projects)
	if err != nil {
		return e.InternalServerError("projects collection unavailable", err)
	}

	rec := core.NewRecord(col)
	rec.Set(collections.FieldName, body.Name)
	rec.Set(collections.FieldProjectDescription, body.Description)
	rec.Set(collections.FieldOwner, e.Auth.Id) // ownership is forced server-side

	if err := h.App.Save(rec); err != nil {
		return e.BadRequestError("failed to create project", err)
	}

	_ = h.audit(e, collections.ActionProjectCreate, rec.Id, "", nil)
	return e.JSON(201, rec)
}

// GetProject returns a single owned project.
func (h *Handlers) GetProject(e *core.RequestEvent) error {
	rec, err := h.requireOwned(e, collections.Projects, e.Request.PathValue("id"), collections.FieldOwner)
	if err != nil {
		return err
	}
	return e.JSON(200, rec)
}

// UpdateProject updates an owned project.
func (h *Handlers) UpdateProject(e *core.RequestEvent) error {
	rec, err := h.requireOwned(e, collections.Projects, e.Request.PathValue("id"), collections.FieldOwner)
	if err != nil {
		return err
	}

	var body projectRequest
	if err := e.BindBody(&body); err != nil {
		return e.BadRequestError("invalid request body", err)
	}
	if body.Name != "" {
		rec.Set(collections.FieldName, body.Name)
	}
	rec.Set(collections.FieldProjectDescription, body.Description)

	if err := h.App.Save(rec); err != nil {
		return e.BadRequestError("failed to update project", err)
	}

	_ = h.audit(e, collections.ActionProjectUpdate, rec.Id, "", nil)
	return e.JSON(200, rec)
}

// DeleteProject deletes an owned project.
func (h *Handlers) DeleteProject(e *core.RequestEvent) error {
	rec, err := h.requireOwned(e, collections.Projects, e.Request.PathValue("id"), collections.FieldOwner)
	if err != nil {
		return err
	}
	if err := h.App.Delete(rec); err != nil {
		return e.InternalServerError("failed to delete project", err)
	}
	_ = h.audit(e, collections.ActionProjectDelete, rec.Id, "", nil)
	return e.NoContent(204)
}
