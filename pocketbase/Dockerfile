# syntax=docker/dockerfile:1

# ============================================================
# Kreach PocketBase
# PocketBase ships no official image, so we fetch the released
# binary and run it directly. Data lives in /pb/pb_data (mount a
# volume there to persist it).
# ============================================================

FROM alpine:3.20

# Pin the PocketBase version and target architecture.
#   amd64 -> linux_amd64 ; arm64 (Apple Silicon) -> linux_arm64
ARG PB_VERSION=0.22.21
ARG PB_ARCH=amd64

RUN apk add --no-cache ca-certificates unzip wget

RUN wget -q "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${PB_ARCH}.zip" -O /tmp/pb.zip \
    && unzip /tmp/pb.zip -d /pb \
    && rm /tmp/pb.zip \
    && chmod +x /pb/pocketbase

WORKDIR /pb
EXPOSE 8090

# pb_data persists collections, settings, and uploaded files.
VOLUME ["/pb/pb_data"]

CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb/pb_data"]
