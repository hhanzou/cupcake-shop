# syntax=docker/dockerfile:1

# A imagem do Node e o runtime final precisam usar a mesma versão do Alpine
ARG NODE_VERSION=22
ARG ALPINE_VERSION=3.24

# ---------------------------------------------------------------------------
# development: usado pelo docker compose (código montado como volume)
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS development

WORKDIR /app

# Prisma precisa do OpenSSL no Alpine
RUN apk add --no-cache openssl

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

# ---------------------------------------------------------------------------
# build: compila o TypeScript e gera o Prisma Client
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS build

WORKDIR /app

RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --ignore-scripts --no-audit --no-fund

COPY prisma/schema.prisma ./prisma/schema.prisma
COPY tsconfig.json ./
COPY src ./src

RUN npx prisma generate && npx tsc

# ---------------------------------------------------------------------------
# deps: instalação limpa só com dependências de produção
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --omit=optional --ignore-scripts --no-audit --no-fund

# Client gerado na etapa de build (só o engine nativo do Alpine é usado)
COPY --from=build /app/node_modules/.prisma/client ./node_modules/.prisma/client

# Remove o que não é usado em runtime: engines WASM/edge, tipos, sourcemaps e docs
RUN cd node_modules \
 && rm -rf .prisma/client/*.wasm .prisma/client/wasm*.js .prisma/client/wasm*.mjs \
           .prisma/client/edge.js .prisma/client/index-browser.js .prisma/client/query_engine_bg.js \
           @prisma/client/runtime/*.wasm* @prisma/client/runtime/*edge* \
           @prisma/client/runtime/query_* @prisma/client/runtime/binary.* \
           @prisma/client/runtime/wasm* @prisma/client/runtime/react-native* \
           @prisma/client/runtime/index-browser* @prisma/client/generator-build \
           @prisma/client/scripts \
 && find . -type f \( -name "*.map" -o -name "*.md" -o -name "*.markdown" \
           -o -name "*.d.ts" -o -name "*.d.mts" -o -name "*.d.cts" -o -name "*.ts.map" \
           -o -name "LICENSE*" -o -name "CHANGELOG*" -o -name ".npmignore" \) -delete \
 && find . -type d \( -name "test" -o -name "tests" -o -name "__tests__" -o -name "docs" \
           -o -name "example" -o -name "examples" -o -name "benchmarks" -o -name ".github" \) \
           -prune -exec rm -rf {} +

# ---------------------------------------------------------------------------
# node: só para extrair o binário do Node
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS node

# ---------------------------------------------------------------------------
# production: Alpine puro + binário do Node, sem npm, yarn ou corepack
# ---------------------------------------------------------------------------
FROM alpine:${ALPINE_VERSION} AS production

# libstdc++ e libgcc: exigidos pelo Node. libssl3 já vem no Alpine (Prisma usa)
RUN apk add --no-cache libstdc++ libgcc \
 && addgroup -S -g 1000 node \
 && adduser -S -u 1000 -G node -H -s /sbin/nologin node

COPY --from=node /usr/local/bin/node /usr/local/bin/node

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

USER node

EXPOSE 3000

CMD ["node", "dist/server.js"]
