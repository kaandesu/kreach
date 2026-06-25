// Command backend is the Kreach REST API service.
//
// It embeds PocketBase as a Go library (single binary, embedded SQLite) and
// exposes a custom, fully authenticated REST API for the Kreach frontend:
// user auth, projects, email templates, email sending (via a user-provided
// Resend key) and per-user send/audit logs.
//
// Run it with:
//
//	go run . serve
package main

import (
	"log"

	"github.com/kreach/backend/internal/handlers"
	"github.com/kreach/backend/internal/ratelimit"
	"github.com/kreach/backend/internal/routes"

	// Side-effect import: registers the schema migrations so PocketBase
	// provisions the collections automatically on first run.
	_ "github.com/kreach/backend/migrations"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
)

func main() {
	app := pocketbase.New()

	// Enable the `migrate` CLI subcommand and auto-apply registered
	// migrations on boot.
	migratecmd.MustRegister(app, app.RootCmd, migratecmd.Config{
		TemplateLang: migratecmd.TemplateLangGo,
		Automigrate:  true,
	})

	h := handlers.New(app, ratelimit.New())

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		routes.Register(se, h)
		return se.Next()
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
