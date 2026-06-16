# ==========================================================
# Multi-stage Dockerfile for GreenLens Frontend (React + Vite)
# Builds static assets with Node and serves them with Nginx.
# ==========================================================

# --- Stage 1: Build the application ---
FROM node:20-alpine AS build
WORKDIR /app

# Copy dependency manifests first to leverage Docker caching.
COPY package*.json ./
RUN npm ci

# Copy source files and build the static bundle.
COPY . .
RUN npm run build

# --- Stage 2: Static web server ---
FROM nginx:1.27-alpine AS final

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
