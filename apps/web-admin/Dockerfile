FROM node:22-bookworm-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/types/package.json packages/types/package.json
COPY apps/web-admin/package.json apps/web-admin/package.json
RUN npm ci --workspace=@safaar/web-admin --include-workspace-root

FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY packages/types packages/types
COPY apps/web-admin apps/web-admin

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build -w @safaar/types
RUN npm run build -w @safaar/web-admin

FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3002

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs \
  && chown -R nextjs:nodejs /app

COPY --from=build --chown=nextjs:nodejs /app/package.json /app/package-lock.json ./
COPY --from=build --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nextjs:nodejs /app/packages/types ./packages/types
COPY --from=build --chown=nextjs:nodejs /app/apps/web-admin ./apps/web-admin

USER nextjs

EXPOSE 3002

CMD ["npm", "run", "start", "-w", "@safaar/web-admin"]
