# Deploy to a DigitalOcean droplet

Production URL: **https://daad.benceluzsinszky.com**

Stack: Docker Compose (Postgres + app) with **Caddy** on the host for HTTPS.

## 1. Cloudflare DNS

In the Cloudflare dashboard for `benceluzsinszky.com`:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | `daad` | Your droplet IP | **DNS only** (grey cloud) |

Grey cloud lets Caddy obtain Let's Encrypt certificates directly. You can switch to proxied (orange cloud) later and set SSL/TLS mode to **Full (strict)** once Caddy is running.

Wait a few minutes for DNS to propagate before starting Caddy.

## 2. Prepare the droplet

```bash
apt update && apt upgrade -y
apt install -y git ca-certificates curl
curl -fsSL https://get.docker.com | sh
```

Log out and back in so your user can run `docker` without `sudo`.

## 3. Clone and configure

```bash
git clone https://github.com/YOUR_USER/timetable.git
cd timetable

cp .env.production.example .env
nano .env   # set POSTGRES_PASSWORD
```

`.env` should look like:

```env
POSTGRES_PASSWORD=your-long-random-password
CLIENT_ORIGIN=https://daad.benceluzsinszky.com
APP_PORT=3001
```

## 4. Start the app

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs -f app
```

Expect: `Serving client from /app/server/client-dist`.

## 5. Seed the database (once)

```bash
docker compose -f docker-compose.prod.yml exec app sh -c 'cd /app/server && node dist/seed.js'
```

## 6. Install Caddy

### Option A — apt (Ubuntu 24.04 LTS)

```bash
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install -y caddy
```

### Option B — binary install (if `apt update` fails)

Use this when Ubuntu repos are broken (e.g. **Oracular 24.10** mirrors no longer available):

```bash
curl -fsSL "https://caddyserver.com/api/download?os=linux&arch=$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/')" -o /usr/local/bin/caddy
chmod +x /usr/local/bin/caddy
mkdir -p /etc/caddy
caddy version

cat >/etc/systemd/system/caddy.service <<'EOF'
[Unit]
Description=Caddy
After=network-online.target
Wants=network-online.target

[Service]
Type=notify
ExecStart=/usr/local/bin/caddy run --environ --config /etc/caddy/Caddyfile
ExecReload=/usr/local/bin/caddy reload --config /etc/caddy/Caddyfile --force
TimeoutStopSec=5s
AmbientCapabilities=CAP_NET_BIND_SERVICE

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable caddy
```

Copy the project Caddyfile and start Caddy:

```bash
cp Caddyfile /etc/caddy/Caddyfile
systemctl start caddy
systemctl status caddy
```

Open **https://daad.benceluzsinszky.com**.

The repo `Caddyfile` is minimal:

```
daad.benceluzsinszky.com {
    reverse_proxy localhost:3001
}
```

Caddy terminates HTTPS and forwards to the Docker app on port 3001.

## 7. Firewall (recommended)

```bash
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable
```

Port 3001 stays internal — only Caddy needs 80/443 publicly.

## Updating

```bash
cd timetable
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Re-run seed after CSV changes or timezone/parser fixes (it **replaces** all events in the DB):

```bash
docker compose -f docker-compose.prod.yml exec app sh -c 'cd /app/server && node dist/seed.js'
```

Verify times: Vedat Akdağ should be `startTime: 2026-06-17T19:00:00.000Z` (21:00 Budapest), not `...T21:00:00.000Z`.

After re-seeding, bump `offlineCacheOptions.buster` in `client/src/lib/trpc.ts` and redeploy so browsers drop stale cached timetables.

## Useful commands

| Task | Command |
|------|---------|
| App logs | `docker compose -f docker-compose.prod.yml logs -f app` |
| Caddy logs | `journalctl -u caddy -f` |
| Restart app | `docker compose -f docker-compose.prod.yml restart app` |
| Reload Caddy | `systemctl reload caddy` |

## Troubleshooting

**Certificate errors** — Confirm the Cloudflare A record is **DNS only** (grey cloud) and points to the droplet IP. Check `dig daad.benceluzsinszky.com`.

**API / CORS errors** — `CLIENT_ORIGIN` in `.env` must be exactly `https://daad.benceluzsinszky.com`.

**502 from Caddy** — App not running: `docker compose -f docker-compose.prod.yml ps` and check logs.

**Orange cloud (proxied) later** — Cloudflare → SSL/TLS → **Full (strict)**. Caddy keeps its origin certificate; visitors get Cloudflare edge TLS.

**`apt update` fails with “oracular Release no longer has a Release file”** — Ubuntu 24.10 (Oracular) is end-of-life on DO mirrors. Use **Option B** (binary Caddy install) above, or recreate the droplet on **Ubuntu 24.04 LTS**.

**Skip Caddy temporarily** — set `APP_PORT=80` in `.env`, restart compose, open `http://YOUR_DROPLET_IP`. Add Caddy/HTTPS later.
