# syntax=docker/dockerfile:1.7
# Build context = monorepo root.

ARG BUN_VERSION=1.3.11
ARG NODE_VERSION=22

FROM oven/bun:${BUN_VERSION}-alpine AS deps
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile

FROM deps AS builder
ARG NEXT_PUBLIC_CONVEX_URL
ENV NEXT_PUBLIC_CONVEX_URL=${NEXT_PUBLIC_CONVEX_URL}
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build --filter=controller

FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/controller/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/controller/.next/static ./apps/controller/.next/static
# apps/controller has no public/ folder — add a COPY line here if/when one is added.

USER nextjs
EXPOSE 8080
CMD ["node", "apps/controller/server.js"]
