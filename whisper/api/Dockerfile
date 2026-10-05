FROM node:24-bookworm-slim AS base

# ffmpeg converts uploads to WAV. nodejs-whisper also needs cmake/build tools
# and curl at runtime: whenever it downloads a model it rebuilds whisper.cpp.
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ffmpeg build-essential cmake curl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable

WORKDIR /app

FROM base AS builder

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM base

ARG WHISPER_MODEL=small
ENV NODE_ENV=production
ENV WHISPER_MODEL=$WHISPER_MODEL
ENV WHISPER_MODEL_DIR=/models

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Compile whisper.cpp and fetch the default model at build time instead of on
# the first request. A fresh named volume on /models is seeded with this model.
RUN cd node_modules/nodejs-whisper/cpp/whisper.cpp \
  && cmake -B build \
  && cmake --build build --config Release -j \
  && mkdir -p /models \
  && ./models/download-ggml-model.sh "$WHISPER_MODEL" /models

COPY --from=builder /app/dist ./dist

EXPOSE 3099

CMD ["node", "dist/main"]
