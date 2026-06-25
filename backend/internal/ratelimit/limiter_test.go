package ratelimit

import (
	"testing"
	"time"
)

func TestThrottleEnforces600ms(t *testing.T) {
	now := time.Unix(0, 0)
	tr := New()
	tr.now = func() time.Time { return now }

	// First send is always allowed.
	if ok, _ := tr.Allow("u1"); !ok {
		t.Fatal("first send should be allowed")
	}

	// A send 100ms later is rejected with the remaining wait.
	now = now.Add(100 * time.Millisecond)
	ok, retry := tr.Allow("u1")
	if ok {
		t.Fatal("send within 600ms should be rejected")
	}
	if want := 500 * time.Millisecond; retry != want {
		t.Fatalf("retryAfter = %v, want %v", retry, want)
	}

	// After the window passes, sending is allowed again.
	now = now.Add(600 * time.Millisecond)
	if ok, _ := tr.Allow("u1"); !ok {
		t.Fatal("send after 600ms window should be allowed")
	}
}

func TestThrottleIsPerUser(t *testing.T) {
	now := time.Unix(0, 0)
	tr := New()
	tr.now = func() time.Time { return now }

	if ok, _ := tr.Allow("u1"); !ok {
		t.Fatal("u1 first send should be allowed")
	}
	// Different user is unaffected by u1's recent send.
	if ok, _ := tr.Allow("u2"); !ok {
		t.Fatal("u2 should not be throttled by u1")
	}
}

func TestReleaseRestoresPreviousClock(t *testing.T) {
	now := time.Unix(100, 0)
	tr := New()
	tr.now = func() time.Time { return now }

	previous := tr.LastSend("u1") // zero, no prior send
	if ok, _ := tr.Allow("u1"); !ok {
		t.Fatal("first send should be allowed")
	}
	// Simulate a downstream rejection: revert the clock.
	tr.Release("u1", previous)

	// The reverted attempt must not count, so an immediate send is allowed.
	if ok, _ := tr.Allow("u1"); !ok {
		t.Fatal("send after Release should be allowed")
	}
}

func TestStartOfDayUTC(t *testing.T) {
	in := time.Date(2026, 6, 25, 14, 30, 45, 0, time.UTC)
	got := StartOfDayUTC(in)
	want := time.Date(2026, 6, 25, 0, 0, 0, 0, time.UTC)
	if !got.Equal(want) {
		t.Fatalf("StartOfDayUTC = %v, want %v", got, want)
	}
}
