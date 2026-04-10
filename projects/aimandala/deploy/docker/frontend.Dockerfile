FROM node:22-alpine AS build

WORKDIR /app

COPY toC/app/frontend/package.json /app/package.json
COPY toC/app/frontend/package-lock.json /app/package-lock.json

RUN npm ci

COPY toC/app/frontend /app

ARG VITE_AIMANDALA_API_BASE_URL=http://web-api.jingshu.cc
ENV VITE_AIMANDALA_API_BASE_URL=${VITE_AIMANDALA_API_BASE_URL}

RUN npm run build:mobile-web

FROM nginx:1.27-alpine

COPY deploy/docker/frontend.nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
