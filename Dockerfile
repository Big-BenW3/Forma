# syntax=docker/dockerfile:1
#
# FORMA: one image, one Render web service.
#
#   deps    install npm packages
#   build   `next build` (standalone output; the prebuild step copies Monaco into public/)
#   runtime the small image that runs the server. It also carries arduino-cli and the
#           Arduino AVR core, because the compile endpoint runs the real toolchain.
#
# The arduino-cli and core versions are build args so they can be bumped without editing
# this file. NOTE: this image has not been built in the authoring sandbox (no access to
# the arduino download host there); the first Render build is its first real run.

ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:${NODE_VERSION}-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:${NODE_VERSION}-bookworm-slim AS runtime
ARG ARDUINO_CLI_VERSION=1.2.2
ARG ARDUINO_AVR_CORE=1.8.6

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl \
 && rm -rf /var/lib/apt/lists/*

# arduino-cli, pinned
RUN curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh \
    | BINDIR=/usr/local/bin sh -s ${ARDUINO_CLI_VERSION}

# The server runs as an ordinary user. The compiler reads the AVR core from this user's home.
RUN useradd --create-home --uid 1001 app
USER app
ENV ARDUINO_HOME=/home/app
RUN arduino-cli config init \
 && arduino-cli core update-index \
 && arduino-cli core install arduino:avr@${ARDUINO_AVR_CORE}

WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=10000
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
COPY --from=build --chown=app:app /app/drizzle ./drizzle

EXPOSE 10000
CMD ["node", "server.js"]
