package handlers

import (
	"strings"

	"github.com/kreach/backend/internal/collections"

	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

type registerRequest struct {
	Email           string `json:"email"`
	Password        string `json:"password"`
	PasswordConfirm string `json:"passwordConfirm"`
	Name            string `json:"name"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// Register creates a new user in the built-in users collection and returns a
// PocketBase auth response (JWT token + record). Public endpoint.
func (h *Handlers) Register(e *core.RequestEvent) error {
	var body registerRequest
	if err := e.BindBody(&body); err != nil {
		return e.BadRequestError("invalid request body", err)
	}

	body.Email = strings.TrimSpace(strings.ToLower(body.Email))
	if body.Email == "" || body.Password == "" {
		return e.BadRequestError("email and password are required", nil)
	}
	if body.PasswordConfirm != "" && body.PasswordConfirm != body.Password {
		return e.BadRequestError("passwords do not match", nil)
	}

	col, err := h.App.FindCollectionByNameOrId(collections.Users)
	if err != nil {
		return e.InternalServerError("users collection unavailable", err)
	}

	rec := core.NewRecord(col)
	rec.SetEmail(body.Email)
	rec.SetPassword(body.Password)
	rec.SetEmailVisibility(false)
	if body.Name != "" {
		rec.Set(collections.FieldName, body.Name)
	}

	if err := h.App.Save(rec); err != nil {
		// Validation errors (e.g. duplicate email, weak password) surface here.
		return e.BadRequestError("failed to create account", err)
	}

	h.auditAuth(e, rec.Id, collections.ActionUserRegister)

	return apis.RecordAuthResponse(e, rec, "password", nil)
}

// Login authenticates a user by email/password and returns an auth response.
// Public endpoint.
func (h *Handlers) Login(e *core.RequestEvent) error {
	var body loginRequest
	if err := e.BindBody(&body); err != nil {
		return e.BadRequestError("invalid request body", err)
	}

	body.Email = strings.TrimSpace(strings.ToLower(body.Email))
	if body.Email == "" || body.Password == "" {
		return e.BadRequestError("email and password are required", nil)
	}

	rec, err := h.App.FindAuthRecordByEmail(collections.Users, body.Email)
	if err != nil || !rec.ValidatePassword(body.Password) {
		// Same response for unknown email and wrong password.
		return e.UnauthorizedError("invalid credentials", nil)
	}

	h.auditAuth(e, rec.Id, collections.ActionUserLogin)

	return apis.RecordAuthResponse(e, rec, "password", nil)
}

// Me returns the authenticated user's profile. Requires auth.
func (h *Handlers) Me(e *core.RequestEvent) error {
	return e.JSON(200, e.Auth)
}

// auditAuth records register/login events. Unlike audit(), the user id is
// passed explicitly because e.Auth is not yet populated on public endpoints.
// Audit failures are intentionally swallowed so they never block auth.
func (h *Handlers) auditAuth(e *core.RequestEvent, userID, action string) {
	col, err := h.App.FindCollectionByNameOrId(collections.AuditLogs)
	if err != nil {
		return
	}
	rec := core.NewRecord(col)
	rec.Set(collections.FieldUser, userID)
	rec.Set(collections.FieldAuditAction, action)
	rec.Set(collections.FieldAuditResource, collections.Users)
	rec.Set(collections.FieldAuditIP, e.RealIP())
	_ = h.App.Save(rec)
}
