# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definition files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci || npm install

# Copy application source code
COPY . .

# Build production assets
RUN npm run build

# Stage 2: Serve application with Nginx
FROM nginx:alpine AS runner

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx web server
CMD ["nginx", "-g", "daemon off;"]
