# Stage 1: Build the frontend
FROM node:18 AS frontend-builder
WORKDIR /app/frontend

# Copy package files
COPY Frontend/package*.json ./
COPY Frontend/vite.config.js* ./

# Install dependencies
RUN npm install

# Copy frontend source
COPY Frontend/ ./

# Build the frontend
RUN npm run build

# Stage 2: Build the backend
FROM python:3.9-slim AS backend-builder
WORKDIR /app/backend

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    libpq-dev \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgtk-3-0 \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    libv4l-dev \
    libxvidcore-dev \
    libx264-dev \
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    libatlas-base-dev \
    gfortran \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY Backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY Backend/ .

# Stage 3: Create the final image
FROM python:3.9-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    libpq5 \
    curl \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    libgtk-3-0 \
    libavcodec58 \
    libavformat58 \
    libswscale5 \
    libv4l-0 \
    libxvidcore4 \
    libx264-155 \
    libjpeg62-turbo \
    libpng16-16 \
    libtiff5 \
    libatlas3-base \
    && rm -rf /var/lib/apt/lists/*

# Copy Python dependencies and backend code
COPY --from=backend-builder /usr/local /usr/local
COPY --from=backend-builder /app/backend /app/backend

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose ports
EXPOSE 80

# Fix NGINX permissions and ensure body directory exists
RUN mkdir -p /var/run/nginx /var/tmp/nginx /var/log/nginx /var/lib/nginx/tmp /var/lib/nginx/body \
    && chown -R www-data:www-data /var/log/nginx /var/run/nginx /var/tmp/nginx /var/lib/nginx \
    && chmod -R 755 /var/log/nginx /var/run/nginx /var/tmp/nginx /var/lib/nginx

# Create a non-root user for backend
RUN useradd -m myuser -u 1000 -g www-data \
    && chown -R myuser:www-data /app

# Switch to root for NGINX so it can write /var/lib/nginx
USER root

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Start backend as myuser, NGINX as root
CMD su myuser -c "cd /app/backend && uvicorn main_simple:app --host 0.0.0.0 --port 5000" & \
    nginx -g 'daemon off;'
