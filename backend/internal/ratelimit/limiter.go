// Package ratelimit enforces the per-user limits on email sending:
//
//   - at least MinInterval (600ms) between two accepted sends, and
//   - at most MaxPerDay (100) sends per calendar day.
//
// The 600ms spacing is tracked in-memory (it only needs to guard bursts within
// a single process), while the daily cap is enforced by the caller against the
// authoritative send_logs count in the database so it survives restarts.
package ratelimit

import (
	"sync"
	"time"
)

const (
	// MinInterval is the minimum delay between two accepted sends per user.
	MinInterval = 600 * time.Millisecond
	// MaxPerDay is the maximum number of sends allowed per user per day.
	MaxPerDay = 100
)

// Throttle tracks the last accepted send time per user id.
type Throttle struct {
	mu   sync.Mutex
	last map[string]time.Time
	now  func() time.Time // injectable for tests
}

// New returns a ready-to-use Throttle.
func New() *Throttle {
	return &Throttle{last: make(map[string]time.Time), now: time.Now}
}

// Allow reports whether userID may send right now based on the 600ms spacing
// rule. When it returns false, retryAfter is the duration the caller should
// wait before trying again. On success the user's last-send time is updated.
func (t *Throttle) Allow(userID string) (ok bool, retryAfter time.Duration) {
	t.mu.Lock()
	defer t.mu.Unlock()

	now := t.now()
	if last, seen := t.last[userID]; seen {
		if elapsed := now.Sub(last); elapsed < MinInterval {
			return false, MinInterval - elapsed
		}
	}
	t.last[userID] = now
	return true, 0
}

// Release reverts the most recent Allow for userID. It is used when a send is
// rejected downstream (e.g. the daily cap is hit) so the spacing clock isn't
// advanced by an attempt that never went out.
func (t *Throttle) Release(userID string, previous time.Time) {
	t.mu.Lock()
	defer t.mu.Unlock()
	if previous.IsZero() {
		delete(t.last, userID)
		return
	}
	t.last[userID] = previous
}

// LastSend returns the stored last-send time for userID (zero if none),
// allowing the caller to restore it via Release on a downstream rejection.
func (t *Throttle) LastSend(userID string) time.Time {
	t.mu.Lock()
	defer t.mu.Unlock()
	return t.last[userID]
}

// StartOfDayUTC returns midnight UTC for the current day, used to bound the
// daily send_logs count query.
func StartOfDayUTC(now time.Time) time.Time {
	u := now.UTC()
	return time.Date(u.Year(), u.Month(), u.Day(), 0, 0, 0, 0, time.UTC)
}
