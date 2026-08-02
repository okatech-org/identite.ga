#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR=/opt/livekit
METADATA_URL=http://metadata.google.internal/computeMetadata/v1

metadata_get() {
  curl --fail --silent --show-error \
    --header 'Metadata-Flavor: Google' \
    "${METADATA_URL}/$1"
}

access_secret() {
  local project_id token payload
  project_id="$(metadata_get project/project-id)"
  token="$(metadata_get instance/service-accounts/default/token | python3 -c 'import json,sys; print(json.load(sys.stdin)["access_token"])')"
  payload="$(curl --fail --silent --show-error \
    --header "Authorization: Bearer ${token}" \
    "https://secretmanager.googleapis.com/v1/projects/${project_id}/secrets/$1/versions/latest:access")"
  SECRET_PAYLOAD="${payload}" python3 -c 'import base64,json,os; print(base64.b64decode(json.loads(os.environ["SECRET_PAYLOAD"])["payload"]["data"]).decode(), end="")'
}

if ! command -v docker >/dev/null 2>&1; then
  curl --fail --silent --show-error --location https://get.docker.com \
    --output /tmp/get-docker.sh
  sh /tmp/get-docker.sh
fi
systemctl enable --now docker

mkdir -p "${INSTALL_DIR}/caddy_data"

LIVEKIT_API_KEY_VALUE="$(access_secret livekit-api-key)"
LIVEKIT_API_SECRET_VALUE="$(access_secret livekit-api-secret)"
DEPLOY_REVISION="$(metadata_get instance/attributes/livekit-deploy-revision)"

cat >"${INSTALL_DIR}/livekit.yaml" <<EOF
port: 7880
bind_addresses:
  - ""
logging:
  json: true
  level: info
rtc:
  tcp_port: 7881
  port_range_start: 50000
  port_range_end: 60000
  use_external_ip: true
redis:
  address: 127.0.0.1:6379
keys:
  "${LIVEKIT_API_KEY_VALUE}": "${LIVEKIT_API_SECRET_VALUE}"
room:
  empty_timeout: 300
  departure_timeout: 20
turn:
  enabled: true
  domain: turn.identite.ga
  external_tls: true
  tls_port: 5349
  udp_port: 3478
EOF
chmod 600 "${INSTALL_DIR}/livekit.yaml"
unset LIVEKIT_API_KEY_VALUE LIVEKIT_API_SECRET_VALUE

cat >"${INSTALL_DIR}/caddy.yaml" <<'EOF'
logging:
  logs:
    default:
      level: INFO
storage:
  module: file_system
  root: /data
apps:
  tls:
    certificates:
      automate:
        - video.identite.ga
        - turn.identite.ga
  layer4:
    servers:
      main:
        listen: [":443"]
        routes:
          - match:
              - tls:
                  sni:
                    - turn.identite.ga
            handle:
              - handler: tls
              - handler: proxy
                upstreams:
                  - dial: ["localhost:5349"]
          - match:
              - tls:
                  sni:
                    - video.identite.ga
            handle:
              - handler: tls
                connection_policies:
                  - alpn: ["http/1.1"]
              - handler: proxy
                upstreams:
                  - dial: ["localhost:7880"]
EOF

cat >"${INSTALL_DIR}/redis.conf" <<'EOF'
bind 127.0.0.1
protected-mode yes
port 6379
save ""
appendonly no
EOF

cat >"${INSTALL_DIR}/docker-compose.yaml" <<'EOF'
services:
  caddy:
    image: livekit/caddyl4:latest
    command: run --config /etc/caddy.yaml --adapter yaml
    restart: unless-stopped
    network_mode: host
    volumes:
      - ./caddy.yaml:/etc/caddy.yaml:ro
      - ./caddy_data:/data
  livekit:
    image: livekit/livekit-server:v1.13.5
    command: --config /etc/livekit.yaml
    restart: unless-stopped
    network_mode: host
    volumes:
      - ./livekit.yaml:/etc/livekit.yaml:ro
    depends_on:
      - redis
  redis:
    image: redis:7-alpine
    command: redis-server /etc/redis.conf
    restart: unless-stopped
    network_mode: host
    volumes:
      - ./redis.conf:/etc/redis.conf:ro
EOF

cat >/etc/sysctl.d/99-livekit.conf <<'EOF'
net.core.rmem_max=2500000
net.core.wmem_max=2500000
EOF
sysctl --system >/dev/null

cd "${INSTALL_DIR}"
docker compose pull
docker compose up --detach --remove-orphans
docker compose ps
test "$(docker compose ps --status running --services | wc -l)" -eq 3

echo "LIVEKIT_BOOTSTRAP_COMPLETE version=v1.13.5 revision=${DEPLOY_REVISION}"
