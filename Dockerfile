FROM node:22-bookworm-slim AS client-build

WORKDIR /app

COPY client/package.json client/package-lock.json ./client/
COPY server/package.json server/package-lock.json ./server/

RUN cd client && npm ci && cd ../server && npm ci

COPY server ./server
COPY client ./client

# prisma generate reads DATABASE_URL from config but does not connect to the DB
ENV DATABASE_URL="postgresql://timetable:timetable@localhost:5432/timetable?schema=public"
RUN cd server && npm run db:generate
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
RUN cd server && npm ci --omit=dev && npm install prisma@^7.0.0 --no-save

COPY --from=server-build /app/server/dist ./server/dist
COPY --from=server-build /app/server/src/generated ./server/src/generated
COPY --from=server-build /app/server/prisma ./server/prisma
COPY --from=server-build /app/server/prisma.config.ts ./server/prisma.config.ts
COPY --from=server-build /app/server/data ./server/data
COPY --from=client-build /app/client/dist ./server/client-dist

COPY scripts/docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["/entrypoint.sh"]
