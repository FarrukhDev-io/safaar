FROM node:22-bookworm-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/types/package.json packages/types/package.json
COPY apps/web-partner/package.json apps/web-partner/package.json
RUN npm ci --workspace=@safaar/web-partner --include-workspace-root

FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY packages/types packages/types
COPY apps/web-partner apps/web-partner

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build -w @safaar/types
RUN npm run build -w @safaar/web-partner

FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs \
  && chown -R nextjs:nodejs /app

COPY --from=build --chown=nextjs:nodejs /app/package.json /app/package-lock.json ./
COPY --from=build --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nextjs:nodejs /app/packages/types ./packages/types
COPY --from=build --chown=nextjs:nodejs /app/apps/web-partner ./apps/web-partner

USER nextjs

EXPOSE 3001

CMD ["npm", "run", "start", "-w", "@safaar/web-partner"]
