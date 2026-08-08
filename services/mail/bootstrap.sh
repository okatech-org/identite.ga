#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

hostnamectl set-hostname mail.idn.ga

apt-get update
apt-get install -y --no-install-recommends ca-certificates curl docker.io
systemctl enable --now docker

docker volume create stalwart-etc >/dev/null
docker volume create stalwart-data >/dev/null

if docker container inspect stalwart >/dev/null 2>&1; then
  docker start stalwart >/dev/null || true
else
  docker run -d \
    --name stalwart \
    --restart unless-stopped \
    --log-opt max-size=20m \
    --log-opt max-file=5 \
    -p 25:25 \
    -p 443:443 \
    -p 465:465 \
    -p 993:993 \
    -p 127.0.0.1:8080:8080 \
    -v stalwart-etc:/etc/stalwart \
    -v stalwart-data:/var/lib/stalwart \
    stalwartlabs/stalwart:v0.16
fi
