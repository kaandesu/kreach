# syntax=docker/dockerfile:1

# ============================================================
# Kreach backend (Go HTTP API)
# ============================================================

ARG GO_VERSION=1.23

# ------------------------------------------------------------
# Stage 1: build a static binary
# ------------------------------------------------------------
FROM golang:${GO_VERSION}-alpine AS builder
WORKDIR /src

# Copy go.mod (and go.sum if present) first for better layer caching.
COPY go.mod go.sum* ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /out/server .

# ------------------------------------------------------------
# Stage 2: minimal runtime (alpine so wget is available for healthchecks)
# ------------------------------------------------------------
FROM alpine:3.20 AS runner
WORKDIR /app

RUN addgroup -S app && adduser -S app -G app
COPY --from=builder /out/server /app/server

ENV PORT=8080
USER app
EXPOSE 8080
CMD ["/app/server"]
