# Frontend Dockerfile (Vite + React)
# Builds static files and serves with Nginx

FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_API_URL
ARG VITE_DOMAIN_SUFFIX
ARG VITE_APP_VERSION

# Set environment variables for build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_DOMAIN_SUFFIX=$VITE_DOMAIN_SUFFIX
ENV VITE_APP_VERSION=$VITE_APP_VERSION

# Build production bundle
RUN npm run build

# Production stage - serve with Nginx
FROM nginx:alpine

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config (already copied to frontend/)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for Nginx (or 3000 for compatibility)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
