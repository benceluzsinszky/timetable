# timetable

A simple webapp to view a timetable of events, where you can favourite events.

## Stack

- **Client** — React, Vite, Tailwind CSS, tRPC + React Query
- **Server** — Express, TypeScript, tRPC, Prisma, PostgreSQL

Types and API contracts are shared automatically: the client imports `AppRouter` from the server, so every query and mutation is fully typed end-to-end.

## Getting started

### 1. Install dependencies

```bash
./scripts/install.sh
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

### 3. Configure the server

```bash
cp server/.env.example server/.env
```

### 4. Set up the database

```bash
./scripts/db-generate.sh
./scripts/db-push.sh
```

### 5. Run dev servers

```bash
./scripts/dev.sh
```

- Client: http://localhost:5173
- Server: http://localhost:3001

## Scripts

| Script | What it does |
|--------|--------------|
| `scripts/install.sh` | `npm install` in client and server |
| `scripts/dev.sh` | Run client and server together |
| `scripts/build.sh` | Build both packages |
| `scripts/db-generate.sh` | Generate Prisma client |
| `scripts/db-push.sh` | Push schema to database |
| `scripts/db-migrate.sh` | Run Prisma migrations |
| `scripts/db-studio.sh` | Open Prisma Studio |

## Project structure

```
├── client/          # Vite + React frontend
├── server/          # Express + tRPC backend
├── scripts/         # Shell scripts for common tasks
└── docker-compose.yml
```

## Adding API endpoints

Define procedures in `server/src/trpc/router.ts`. The client picks up types automatically:

```ts
// server
events: router({
  list: publicProcedure.query(/* ... */),
}),

// client — fully typed, no codegen step
const events = trpc.events.list.useQuery()
```
