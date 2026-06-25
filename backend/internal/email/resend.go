// Package email sends transactional email through the Resend HTTP API.
//
// The Resend API key is provided per-request by the caller and is used only
// for the outbound call. It is never stored on disk, in a collection, or in
// any log.
package email

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const resendEndpoint = "https://api.resend.com/emails"

// Message is a single email to deliver.
type Message struct {
	From    string
	To      string
	Subject string
	HTML    string
}

// resendRequest is the JSON body expected by the Resend API.
type resendRequest struct {
	From    string   `json:"from"`
	To      []string `json:"to"`
	Subject string   `json:"subject"`
	HTML    string   `json:"html"`
}

type resendResponse struct {
	ID string `json:"id"`
}

// httpClient is shared and has a sane timeout so a hung Resend call can't pin
// a request goroutine indefinitely.
var httpClient = &http.Client{Timeout: 15 * time.Second}

// Send delivers msg via Resend using the supplied apiKey and returns the
// provider message id on success. The apiKey is never retained.
func Send(ctx context.Context, apiKey string, msg Message) (string, error) {
	payload, err := json.Marshal(resendRequest{
		From:    msg.From,
		To:      []string{msg.To},
		Subject: msg.Subject,
		HTML:    msg.HTML,
	})
	if err != nil {
		return "", fmt.Errorf("encode resend request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, resendEndpoint, bytes.NewReader(payload))
	if err != nil {
		return "", fmt.Errorf("build resend request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("call resend: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("resend returned %d: %s", resp.StatusCode, string(body))
	}

	var parsed resendResponse
	if err := json.Unmarshal(body, &parsed); err != nil {
		// Delivery succeeded even if we couldn't parse the id.
		return "", nil
	}
	return parsed.ID, nil
}
