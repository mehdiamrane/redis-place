FROM node:18-alpine AS build

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/backend/package.json apps/backend/

RUN npm ci

COPY packages/shared/ packages/shared/
COPY apps/backend/ apps/backend/

RUN npm run build --workspace=@redis-place/shared && \
    npm run build --workspace=@redis-place/backend

FROM node:18-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/backend/package.json apps/backend/

RUN npm ci --omit=dev

COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/apps/backend/dist apps/backend/dist

EXPOSE 3001

CMD ["node", "apps/backend/dist/index.js"]
