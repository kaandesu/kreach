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

FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/dist ./dist

USER node
EXPOSE 3000
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
