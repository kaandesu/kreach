// Kreach backend — minimal stdlib HTTP API scaffold.
//
// Exposes:
//   GET /health  -> liveness probe used by the docker-compose healthcheck
//   GET /        -> basic JSON showing the service is wired to PocketBase
package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
)

func main() {
	port := getenv("PORT", "8080")
	pocketbaseURL := getenv("POCKETBASE_URL", "")

	mux := http.NewServeMux()

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{
			"service":       "kreach-backend",
			"pocketbase_url": pocketbaseURL,
		})
	})

	addr := ":" + port
	log.Printf("kreach-backend listening on %s (pocketbase=%q)", addr, pocketbaseURL)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatal(err)
	}
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}
