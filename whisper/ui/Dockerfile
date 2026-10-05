FROM node:24-alpine AS builder

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Vite inlines this at build time, so it must be the URL the browser uses.
ARG VITE_API_URL=http://localhost:3099
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build/client /usr/share/nginx/html

EXPOSE 3100

CMD ["nginx", "-g", "daemon off;"]
