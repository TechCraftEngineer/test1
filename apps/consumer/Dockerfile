FROM oven/bun:1.3-alpine AS builder
WORKDIR /app

COPY package.json bun.lock turbo.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/producer/package.json apps/producer/
COPY apps/consumer/package.json apps/consumer/
COPY apps/telegram/package.json apps/telegram/

RUN bun install --frozen-lockfile

COPY packages/shared packages/shared
COPY apps/consumer apps/consumer

RUN bun run --cwd packages/shared build
RUN bun run --cwd apps/consumer build

FROM oven/bun:1.3-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/consumer ./apps/consumer

RUN addgroup -S app && adduser -S -G app app \
  && chown -R app:app /app

USER app

EXPOSE 3002
CMD ["bun", "run", "apps/consumer/dist/main.js"]
