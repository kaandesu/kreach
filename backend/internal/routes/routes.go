// Package routes registers all Kreach custom API endpoints onto PocketBase's
// native router. Public auth routes live under /api/auth/{register,login};
// everything else is bound with apis.RequireAuth("users") so no data endpoint
// is reachable without a valid user session.
package routes

import (
	"github.com/kreach/backend/internal/collections"
	"github.com/kreach/backend/internal/handlers"

	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

// Register mounts the API on the given ServeEvent router.
func Register(se *core.ServeEvent, h *handlers.Handlers) {
	api := se.Router.Group("/api")

	// ---- public auth ----------------------------------------------------
	api.POST("/auth/register", h.Register)
	api.POST("/auth/login", h.Login)

	// ---- authenticated -------------------------------------------------
	auth := api.Group("")
	auth.Bind(apis.RequireAuth(collections.Users))

	auth.GET("/auth/me", h.Me)

	auth.GET("/projects", h.ListProjects)
	auth.POST("/projects", h.CreateProject)
	auth.GET("/projects/{id}", h.GetProject)
	auth.PATCH("/projects/{id}", h.UpdateProject)
	auth.DELETE("/projects/{id}", h.DeleteProject)

	auth.GET("/templates", h.ListTemplates)
	auth.POST("/templates", h.CreateTemplate)
	auth.GET("/templates/{id}", h.GetTemplate)
	auth.PATCH("/templates/{id}", h.UpdateTemplate)
	auth.DELETE("/templates/{id}", h.DeleteTemplate)

	auth.POST("/emails/send", h.SendEmail)

	auth.GET("/logs/sends", h.ListSendLogs)
	auth.GET("/logs/audit", h.ListAuditLogs)
}
