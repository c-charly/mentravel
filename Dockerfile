# syntax=docker/dockerfile:1
# MEN TRAVEL - image de production.
# Pas de serveur web (nginx, caddy): Dokploy gere le reverse proxy et le TLS.

ARG NODE_VERSION=24
ARG PNPM_VERSION=12.16.1

# ---------- base ----------
FROM node:${NODE_VERSION}-alpine AS base
ARG PNPM_VERSION
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN npm install -g pnpm@${PNPM_VERSION}
WORKDIR /app

# ---------- deps ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

# ---------- build ----------
FROM deps AS build
# URL publique: utilisee pour les liens hreflang et canoniques (a passer en build arg dans Dokploy)
ARG NUXT_PUBLIC_SITE_URL=http://localhost:3000
ENV NUXT_PUBLIC_SITE_URL=${NUXT_PUBLIC_SITE_URL}
COPY . .
RUN pnpm build

# ---------- runtime ----------
FROM node:${NODE_VERSION}-alpine AS runtime
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NUXT_DATA_DIR=/data
WORKDIR /app
COPY --from=build /app/.output ./.output
RUN mkdir -p /data && chown -R node:node /data /app
USER node
VOLUME ["/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", ".output/server/index.mjs"]
