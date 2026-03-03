FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ARG NUXT_APP_BASE_URL=/
ENV NUXT_APP_BASE_URL=${NUXT_APP_BASE_URL}
RUN npm run generate

FROM nginx:1.27-alpine AS runtime
WORKDIR /usr/share/nginx/html

COPY --from=builder /app/.output/public ./
RUN cp index.html 404.html || true

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
