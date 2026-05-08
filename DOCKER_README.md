# VyomAi Docker Deployment Guide

This guide explains how to deploy the VyomAi application using Docker on Hostinger or any Docker-compatible platform.

## Prerequisites

- Docker installed on your server
- Docker Compose installed (optional but recommended)
- Environment variables configured

## Environment Variables Required

Before deploying, you need to set up these environment variables:

```
OPENAI_API_KEY=<your-openai-api-key>
SESSION_SECRET=<your-random-secret-key>
DATABASE_URL=<your-database-url-optional>
```

### Getting Your Keys

1. **OPENAI_API_KEY**: Get from https://platform.openai.com/api-keys
2. **SESSION_SECRET**: Generate a random secret (min 32 characters):
   ```bash
   openssl rand -hex 32
   ```
3. **DATABASE_URL** (Optional): Only needed if using PostgreSQL. Format:
   ```
   postgresql://user:password@host:5432/database
   ```

## Deployment Methods

### Method 1: Using Docker Compose (Recommended)

1. **Prepare environment file** (`.env`):
   ```
   OPENAI_API_KEY=sk-xxxxxxxxxxxx
   SESSION_SECRET=your_random_secret_here
   DATABASE_URL=postgresql://user:pass@host:5432/db
   ```

2. **Build and run**:
   ```bash
   docker-compose up -d
   ```

3. **Check status**:
   ```bash
   docker-compose ps
   docker-compose logs -f
   ```

4. **Stop the application**:
   ```bash
   docker-compose down
   ```

### Method 2: Using Docker CLI Only

1. **Build the image**:
   ```bash
   docker build -t vyomai-app:latest .
   ```

2. **Run the container**:
   ```bash
   docker run -d \
     --name vyomai \
     -p 5000:5000 \
     -e OPENAI_API_KEY="sk-xxxxxxxxxxxx" \
     -e SESSION_SECRET="your_random_secret_here" \
     -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
     --restart unless-stopped \
     vyomai-app:latest
   ```

3. **View logs**:
   ```bash
   docker logs -f vyomai
   ```

4. **Stop the container**:
   ```bash
   docker stop vyomai
   docker rm vyomai
   ```

## Hostinger-Specific Setup

### 1. Upload Files to Hostinger

- Upload the entire project directory to your Hostinger server
- Ensure `Dockerfile`, `.dockerignore`, and `docker-compose.yml` are included

### 2. Connect via SSH

```bash
ssh username@your-hostinger-server.com
```

### 3. Create Environment File

```bash
cd /path/to/vyomai-app
nano .env
```

Add your environment variables:
```
OPENAI_API_KEY=sk-xxxxxxxxxxxx
SESSION_SECRET=your_random_secret_here
DATABASE_URL=postgresql://user:pass@host:5432/db
```

Save (Ctrl+O, Enter, Ctrl+X)

### 4. Build and Deploy

```bash
# Build the Docker image
docker build -t vyomai-app:latest .

# Run with Docker Compose
docker-compose up -d

# OR run with Docker directly
docker run -d \
  --name vyomai \
  -p 5000:5000 \
  --env-file .env \
  --restart unless-stopped \
  vyomai-app:latest
```

### 5. Configure Hostinger Reverse Proxy (if needed)

If your server has multiple ports and you need to access from port 80/443:

1. Set up an nginx reverse proxy or use Hostinger's web server configuration
2. Point requests to `http://localhost:5000`

### 6. Verify Deployment

```bash
# Check if container is running
docker ps

# View logs
docker logs vyomai

# Test the application
curl http://localhost:5000
```

## Updating the Application

1. Pull the latest code:
   ```bash
   git pull origin main
   ```

2. Rebuild the Docker image:
   ```bash
   docker-compose down
   docker build -t vyomai-app:latest .
   docker-compose up -d
   ```

3. Or with Docker CLI:
   ```bash
   docker stop vyomai
   docker rm vyomai
   docker build -t vyomai-app:latest .
   docker run -d \
     --name vyomai \
     -p 5000:5000 \
     --env-file .env \
     --restart unless-stopped \
     vyomai-app:latest
   ```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs vyomai

# Verify environment variables
docker inspect vyomai | grep -A 10 Env
```

### Port already in use

```bash
# Find process using port 5000
lsof -i :5000

# Kill the process or use a different port
docker run -d -p 5001:5000 vyomai-app:latest
```

### Build fails

- Ensure `Node.js 18+` is compatible with your system
- Check internet connection (npm install might be slow)
- Review build output: `docker build --no-cache -t vyomai-app:latest .`

### Out of memory

Add memory limits to `docker-compose.yml`:
```yaml
services:
  vyomai-app:
    # ... other configs
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

## Performance Optimization

### Enable Multi-stage Build

The Dockerfile already uses multi-stage builds to minimize image size.

### Monitor Resources

```bash
docker stats vyomai
```

### Use .dockerignore

The `.dockerignore` file is already configured to exclude unnecessary files and reduce image size.

## Security Best Practices

1. **Use environment variables** for sensitive data (never hardcode secrets)
2. **Run as non-root user** (already configured in Dockerfile)
3. **Keep Docker images updated**:
   ```bash
   docker pull node:18-alpine
   ```
4. **Use secrets management** for production (consider Docker Secrets or external key management)
5. **Never commit `.env` file** to version control

## HTTPS/SSL Support

Your application **fully supports HTTPS!** 

### For HTTPS Setup:
1. See **HTTPS_SETUP.md** for complete SSL/TLS configuration
2. Use **docker-compose-https.yml** for HTTPS deployment
3. Upload your SSL certificates to the `certs/` folder
4. Run: `docker-compose -f docker-compose-https.yml up -d`

### Quick HTTPS Deploy:
```bash
# 1. Get SSL cert from Hostinger or Let's Encrypt
# 2. Place certificate.crt and private.key in certs/ folder
# 3. Deploy
docker-compose -f docker-compose-https.yml up -d
```

Your site will be accessible at: `https://yourdomain.com` ✅

## Support & Documentation

- Docker: https://docs.docker.com/
- Node.js: https://nodejs.org/
- Express: https://expressjs.com/
- React/Vite: https://vitejs.dev/
- Nginx: https://nginx.org/en/docs/
- Let's Encrypt: https://letsencrypt.org/
