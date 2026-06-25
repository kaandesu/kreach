// Package migrations holds the Go migrations that define the Kreach schema.
//
// Registered migrations are applied automatically by PocketBase on `serve`
// (and via the `migrate` command), so importing this package for its side
// effects is enough to provision the collections on a fresh database.
package migrations

import (
	"github.com/kreach/backend/internal/collections"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
)

func init() {
	m.Register(up, down)
}

// up creates the projects, templates, send_logs and audit_logs collections.
//
// Every collection is "locked down": list/view are restricted to the owning
// user and create/update/delete are superuser-only (nil rule). All writes go
// through the authenticated custom API handlers, so the auto-generated REST
// API never exposes or mutates another user's data.
func up(app core.App) error {
	users, err := app.FindCollectionByNameOrId(collections.Users)
	if err != nil {
		return err
	}

	// Allow the built-in users collection to carry a display name.
	if users.Fields.GetByName(collections.FieldName) == nil {
		users.Fields.Add(&core.TextField{Name: collections.FieldName, Max: 255})
		if err := app.Save(users); err != nil {
			return err
		}
	}

	// ---- projects -------------------------------------------------------
	projects := core.NewBaseCollection(collections.Projects)
	ownerOnly := "@request.auth.id != '' && " + collections.FieldOwner + " = @request.auth.id"
	projects.ListRule = types.Pointer(ownerOnly)
	projects.ViewRule = types.Pointer(ownerOnly)
	// create/update/delete left nil => superuser-only; handled by the API.
	projects.Fields.Add(&core.TextField{Name: collections.FieldName, Required: true, Max: 255})
	projects.Fields.Add(&core.TextField{Name: collections.FieldProjectDescription, Max: 2000})
	projects.Fields.Add(&core.EditorField{Name: collections.FieldProjectEmails})
	projects.Fields.Add(&core.EditorField{Name: collections.FieldProjectBrandingNotes})
	projects.Fields.Add(&core.BoolField{Name: collections.FieldProjectResendConfigured})
	projects.Fields.Add(&core.SelectField{
		Name:      collections.FieldProjectStatus,
		Required:  true,
		MaxSelect: 1,
		Values:    []string{"draft", "generating", "ready", "sending", "sent"},
	})
	projects.Fields.Add(&core.RelationField{
		Name:          collections.FieldOwner,
		Required:      true,
		MaxSelect:     1,
		CollectionId:  users.Id,
		CascadeDelete: true,
	})
	projects.Fields.Add(&core.AutodateField{Name: collections.FieldCreated, OnCreate: true})
	projects.Fields.Add(&core.AutodateField{Name: collections.FieldUpdated, OnCreate: true, OnUpdate: true})
	projects.AddIndex("idx_projects_owner", false, collections.FieldOwner, "")
	if err := app.Save(projects); err != nil {
		return err
	}

	// ---- templates ------------------------------------------------------
	templates := core.NewBaseCollection(collections.Templates)
	templates.ListRule = types.Pointer(ownerOnly)
	templates.ViewRule = types.Pointer(ownerOnly)
	templates.Fields.Add(&core.TextField{Name: collections.FieldName, Required: true, Max: 255})
	templates.Fields.Add(&core.TextField{Name: collections.FieldTemplateSubject, Max: 500})
	templates.Fields.Add(&core.EditorField{Name: collections.FieldTemplateBody, Required: true})
	templates.Fields.Add(&core.TextField{Name: collections.FieldTemplateModel, Max: 255})
	templates.Fields.Add(&core.EditorField{Name: collections.FieldTemplatePrompt})
	templates.Fields.Add(&core.BoolField{Name: collections.FieldTemplateSelected})
	templates.Fields.Add(&core.RelationField{
		Name:          collections.FieldOwner,
		Required:      true,
		MaxSelect:     1,
		CollectionId:  users.Id,
		CascadeDelete: true,
	})
	templates.Fields.Add(&core.RelationField{
		Name:          collections.FieldTemplateProject,
		MaxSelect:     1,
		CollectionId:  projects.Id,
		CascadeDelete: false,
	})
	templates.Fields.Add(&core.AutodateField{Name: collections.FieldCreated, OnCreate: true})
	templates.Fields.Add(&core.AutodateField{Name: collections.FieldUpdated, OnCreate: true, OnUpdate: true})
	templates.AddIndex("idx_templates_owner", false, collections.FieldOwner, "")
	if err := app.Save(templates); err != nil {
		return err
	}

	// ---- send_logs ------------------------------------------------------
	sendLogs := core.NewBaseCollection(collections.SendLogs)
	sendLogs.ListRule = types.Pointer(ownerOnly)
	sendLogs.ViewRule = types.Pointer(ownerOnly)
	sendLogs.Fields.Add(&core.RelationField{
		Name:          collections.FieldOwner,
		Required:      true,
		MaxSelect:     1,
		CollectionId:  users.Id,
		CascadeDelete: true,
	})
	sendLogs.Fields.Add(&core.EmailField{Name: collections.FieldSendRecipient, Required: true})
	sendLogs.Fields.Add(&core.RelationField{
		Name:         collections.FieldSendTemplate,
		MaxSelect:    1,
		CollectionId: templates.Id,
	})
	sendLogs.Fields.Add(&core.RelationField{
		Name:         collections.FieldSendProject,
		MaxSelect:    1,
		CollectionId: projects.Id,
	})
	sendLogs.Fields.Add(&core.TextField{Name: collections.FieldSendSubject, Max: 500})
	sendLogs.Fields.Add(&core.SelectField{
		Name:      collections.FieldSendStatus,
		Required:  true,
		MaxSelect: 1,
		Values:    []string{collections.StatusQueued, collections.StatusSent, collections.StatusFailed},
	})
	sendLogs.Fields.Add(&core.TextField{Name: collections.FieldSendError, Max: 2000})
	sendLogs.Fields.Add(&core.TextField{Name: collections.FieldSendProviderID, Max: 255})
	sendLogs.Fields.Add(&core.AutodateField{Name: collections.FieldCreated, OnCreate: true})
	sendLogs.AddIndex("idx_send_logs_owner", false, collections.FieldOwner, "")
	sendLogs.AddIndex("idx_send_logs_recipient", false, collections.FieldSendRecipient, "")
	sendLogs.AddIndex("idx_send_logs_created", false, collections.FieldCreated, "")
	if err := app.Save(sendLogs); err != nil {
		return err
	}

	// ---- audit_logs -----------------------------------------------------
	auditLogs := core.NewBaseCollection(collections.AuditLogs)
	auditOwnerOnly := "@request.auth.id != '' && " + collections.FieldUser + " = @request.auth.id"
	auditLogs.ListRule = types.Pointer(auditOwnerOnly)
	auditLogs.ViewRule = types.Pointer(auditOwnerOnly)
	auditLogs.Fields.Add(&core.RelationField{
		Name:          collections.FieldUser,
		Required:      true,
		MaxSelect:     1,
		CollectionId:  users.Id,
		CascadeDelete: true,
	})
	auditLogs.Fields.Add(&core.TextField{Name: collections.FieldAuditAction, Required: true, Max: 100})
	auditLogs.Fields.Add(&core.TextField{Name: collections.FieldAuditResource, Max: 255})
	auditLogs.Fields.Add(&core.EmailField{Name: collections.FieldAuditRecipient})
	auditLogs.Fields.Add(&core.TextField{Name: collections.FieldAuditIP, Max: 100})
	auditLogs.Fields.Add(&core.JSONField{Name: collections.FieldAuditDetails, MaxSize: 50000})
	auditLogs.Fields.Add(&core.AutodateField{Name: collections.FieldCreated, OnCreate: true})
	auditLogs.AddIndex("idx_audit_logs_user", false, collections.FieldUser, "")
	auditLogs.AddIndex("idx_audit_logs_recipient", false, collections.FieldAuditRecipient, "")
	return app.Save(auditLogs)
}

// down removes the collections in reverse dependency order.
func down(app core.App) error {
	for _, name := range []string{
		collections.AuditLogs,
		collections.SendLogs,
		collections.Templates,
		collections.Projects,
	} {
		col, err := app.FindCollectionByNameOrId(name)
		if err != nil {
			continue // already gone
		}
		if err := app.Delete(col); err != nil {
			return err
		}
	}
	return nil
}
