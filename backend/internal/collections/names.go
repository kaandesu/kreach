// Package collections is the single source of truth for the names of the
// PocketBase collections and their fields used across the Kreach backend.
//
// Keeping these as constants avoids typo-driven bugs between the migration
// that defines the schema and the handlers that read/write records.
package collections

// Collection names.
const (
	// Users is PocketBase's built-in auth collection. It backs authentication
	// and is the owner of every other record in the system.
	Users = "users"

	Projects  = "projects"
	Templates = "templates"
	SendLogs  = "send_logs"
	AuditLogs = "audit_logs"
)

// Shared field names.
const (
	FieldOwner   = "owner" // relation -> users (projects, templates, send_logs)
	FieldUser    = "user"  // relation -> users (audit_logs)
	FieldName    = "name"
	FieldCreated = "created"
	FieldUpdated = "updated"
)

// Project fields.
const (
	FieldProjectDescription      = "description"
	FieldProjectEmails           = "emails"
	FieldProjectBrandingNotes    = "branding_notes"
	FieldProjectResendConfigured = "resend_configured"
	FieldProjectStatus           = "status"
)

// Template fields.
const (
	FieldTemplateSubject  = "subject"
	FieldTemplateBody     = "html"
	FieldTemplateProject  = "project" // relation -> projects (optional)
	FieldTemplateModel    = "model"
	FieldTemplatePrompt   = "prompt"
	FieldTemplateSelected = "selected"
)

// SendLog fields.
const (
	FieldSendRecipient  = "recipient"
	FieldSendTemplate   = "template" // relation -> templates (optional)
	FieldSendProject    = "project"  // relation -> projects (optional)
	FieldSendSubject    = "subject"
	FieldSendStatus     = "status"
	FieldSendError      = "error"
	FieldSendProviderID = "provider_id"
)

// SendLog status values.
const (
	StatusSent   = "sent"
	StatusFailed = "failed"
	StatusQueued = "queued"
)

// AuditLog fields.
const (
	FieldAuditAction    = "action"
	FieldAuditResource  = "resource"
	FieldAuditRecipient = "recipient"
	FieldAuditIP        = "ip"
	FieldAuditDetails   = "details"
)

// Audit action identifiers.
const (
	ActionUserRegister   = "user.register"
	ActionUserLogin      = "user.login"
	ActionProjectCreate  = "project.create"
	ActionProjectUpdate  = "project.update"
	ActionProjectDelete  = "project.delete"
	ActionTemplateCreate = "template.create"
	ActionTemplateUpdate = "template.update"
	ActionTemplateDelete = "template.delete"
	ActionEmailSend      = "email.send"
)
