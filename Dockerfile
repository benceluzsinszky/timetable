FROM node:22-bookworm-slim AS client-build

WORKDIR /app

COPY client/package.json client/package-lock.json ./client/
COPY server/package.json server/package-lock.json ./server/
COPY server/src/trpc ./server/src/trpc
COPY server/src/lib/festival-day.ts ./server/src/lib/festival-day.ts

RUN cd client && npm ci

COPY client ./client

RUN cd client && npm run build

FROM node:22-bookworm-slim AS server-build

WORKDIR /app/server

COPY server/package.json server/package-lock.json ./
RUN npm ci

COPY server ./

RUN npm run db:generate && npm run build

FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev && npm install prisma@^7.0.0 tsx@^4.20.6 --no-save

COPY --from=server-build /app/server/dist ./server/dist
COPY --from=server-build /app/server/src/generated ./server/src/generated
COPY --from=server-build /app/server/prisma ./server/prisma
COPY --from=server-build /app/server/prisma.config.ts ./server/prisma.config.ts
COPY --from=server-build /app/server/data ./server/data
COPY --from=server-build /app/server/src/seed.ts ./server/src/seed.ts
COPY --from=server-build /app/server/src/lib ./server/src/lib
COPY --from=client-build /app/client/dist ./server/client-dist

COPY scripts/docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["/entrypoint.sh"]
