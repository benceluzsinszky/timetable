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

```bash
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install -y caddy
```

Copy the project Caddyfile:

```bash
cp Caddyfile /etc/caddy/Caddyfile
systemctl reload caddy
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

Re-run seed only if you need to reload CSV data (it **replaces** all events and favourites).

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
