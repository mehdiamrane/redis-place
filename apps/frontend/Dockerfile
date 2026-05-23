FROM node:18-alpine AS build

ARG VITE_SERVER_URL
ARG VITE_PIXEL_COOLDOWN_MS=1000

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/frontend/package.json apps/frontend/

RUN npm ci

COPY packages/shared/ packages/shared/
COPY apps/frontend/ apps/frontend/

RUN npm run build --workspace=@redis-place/shared && \
    npm run build --workspace=@redis-place/frontend

FROM nginx:alpine

COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html

EXPOSE 80
