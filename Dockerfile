ARG BUN_VERSION=1.3.14
FROM oven/bun:${BUN_VERSION}-alpine AS base

FROM base AS prepare
WORKDIR /app
COPY . .
ARG APP=@repo/consumer
RUN bunx turbo prune "${APP}" --docker

FROM base AS builder
WORKDIR /app
COPY --from=prepare /app/out/json/ .
RUN bun install --frozen-lockfile
COPY --from=prepare /app/out/full/ .
COPY --from=prepare /app/tsconfig.base.json ./tsconfig.base.json
ARG APP=@repo/consumer
RUN bunx turbo build --filter="${APP}"

FROM oven/bun:${BUN_VERSION}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

ARG APP_ENTRY=apps/consumer/dist/main.js
ENV APP_ENTRY=${APP_ENTRY}

ARG PORT=3002
EXPOSE ${PORT}

RUN addgroup -S app && adduser -S -G app app

COPY --from=builder --chown=app:app /app .

USER app

CMD bun run "${APP_ENTRY}"
