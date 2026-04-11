FROM node:24-alpine AS build

WORKDIR /workspace/projects/aimandala/toC/app/frontend

COPY toC/app/frontend/package.json ./package.json
COPY toC/app/frontend/package-lock.json ./package-lock.json

RUN npm install

COPY . /workspace/projects/aimandala

ARG VITE_AIMANDALA_API_BASE_URL=http://web-api.jingshu.cc
ENV VITE_AIMANDALA_API_BASE_URL=${VITE_AIMANDALA_API_BASE_URL}

RUN npm run build:mobile-web

FROM nginx:1.27-alpine

COPY deploy/docker/frontend.nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/projects/aimandala/toC/app/frontend/dist /usr/share/nginx/html

EXPOSE 80
