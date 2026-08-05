FROM node:22-bookworm-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/types/package.json packages/types/package.json
COPY apps/backend/package.json apps/backend/package.json
RUN npm ci --workspace=@safaar/backend --include-workspace-root

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY packages/types packages/types
COPY apps/backend apps/backend
RUN npm run build:types && npm run build:backend

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/types ./packages/types
COPY --from=build /app/apps/backend ./apps/backend

RUN groupadd --system --gid 1001 safaar \
  && useradd --system --uid 1001 --gid safaar --home-dir /app safaar \
  && mkdir -p /app/uploads \
  && chown -R safaar:safaar /app

USER safaar

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "const port=process.env.PORT||4000; const prefix=process.env.API_PREFIX||'v1'; fetch(`http://127.0.0.1:${port}/${prefix}/health`).then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1));"
CMD ["npm", "run", "start:prod", "-w", "@safaar/backend"]
