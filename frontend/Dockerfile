# syntax=docker/dockerfile:1

# ============================================================
# Kreach frontend (Vite React)
# ============================================================

ARG NODE_VERSION=22-slim

# ------------------------------------------------------------
# Stage 1: install dependencies
# ------------------------------------------------------------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund; \
    else \
      npm install --no-audit --no-fund; \
    fi

FROM node:${NODE_VERSION} AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG VITE_PB_URL=http://localhost:8080
ARG VITE_SEND_ROUTE=/api/emails/send
ENV VITE_PB_URL=${VITE_PB_URL}
ENV VITE_SEND_ROUTE=${VITE_SEND_ROUTE}
ENV NODE_ENV=production
RUN npm run build

FROM nginx:1.27-alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3000
