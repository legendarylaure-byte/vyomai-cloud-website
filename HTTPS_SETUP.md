# HTTPS Setup Guide for VyomAi on Hostinger

Your VyomAi application can run on HTTPS! This guide explains how to set it up with SSL/TLS certificates.

## Overview

The setup uses **Nginx as a reverse proxy** to:
- Handle HTTPS requests on ports 80 (HTTP) and 443 (HTTPS)
- Automatically redirect HTTP → HTTPS
- Forward requests to the Node.js app running on port 5000
- Provide security headers and compression

## Prerequisites

- SSL/TLS certificate and private key files
- Docker and Docker Compose installed
- Domain name configured to point to your server

## Getting SSL Certificates

### Option 1: Free Certificate from Hostinger (Recommended)

1. Log in to Hostinger Control Panel
2. Go to **SSL/TLS Certificates**
3. Click **Manage** for your domain
4. Select **Autofresh Free SSL by Let's Encrypt**
5. Click **Install** or **Activate**
6. Once active, download the certificate:
   - Certificate file: `certificate.crt`
   - Private key: `private.key`

### Option 2: Generate with Let's Encrypt Certbot

On your server:

```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx -y

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Certificates will be in: /etc/letsencrypt/live/yourdomain.com/
# fullchain.pem = certificate.crt
# privkey.pem = private.key
```

### Option 3: Self-Signed Certificate (Development Only)

```bash
# Generate self-signed certificate (valid for 365 days)
openssl req -x509 -newkey rsa:4096 -keyout private.key -out certificate.crt -days 365 -nodes

# You'll be prompted for certificate details:
# Country, State, City, Organization, Common Name (use your domain)
```

## Deployment Steps

### Step 1: Create Certs Directory

```bash
# On your Hostinger server
cd /path/to/vyomai-app

# Create directory for certificates
mkdir -p certs
```

### Step 2: Upload SSL Certificates

Upload your certificate files to the `certs` folder:
- `certificate.crt` - The SSL certificate
- `private.key` - The private key

**Important:** Never expose your `private.key` publicly!

```bash
# Verify files are in place
ls -la certs/
# Should show: certificate.crt and private.key
```

### Step 3: Deploy with HTTPS

**Option A: Using docker-compose-https.yml**

```bash
# Use the HTTPS-enabled configuration
docker-compose -f docker-compose-https.yml up -d
```

**Option B: Modify Your Existing docker-compose.yml**

Replace your `docker-compose.yml` with the HTTPS version:

```bash
# Backup current compose file
cp docker-compose.yml docker-compose-http.yml

# Use HTTPS version
cp docker-compose-https.yml docker-compose.yml

# Deploy
docker-compose up -d
```

### Step 4: Verify HTTPS is Working

```bash
# Check containers
docker ps

# View logs
docker-compose logs -f

# Test HTTP → HTTPS redirect
curl -v http://localhost/ -L

# Test HTTPS (with self-signed cert, you'll see warning)
curl -v --insecure https://localhost/

# Or from browser
# http://yourdomain.com  → should redirect to https://yourdomain.com
# https://yourdomain.com → should work (may show cert warning for self-signed)
```

## File Structure

After setup, your project should look like:

```
/path/to/vyomai-app/
├── Dockerfile
├── docker-compose.yml (HTTPS version)
├── docker-compose-https.yml (or backup)
├── nginx.conf
├── .env
├── certs/
│   ├── certificate.crt
│   └── private.key
├── package.json
├── server/
├── client/
└── ... (other files)
```

## Updating SSL Certificates

### When Certificate Expires (Let's Encrypt)

```bash
# Renew certificate
sudo certbot renew --force-renewal

# Copy updated certificate to certs folder
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem certs/certificate.crt
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem certs/private.key

# Restart nginx in Docker
docker-compose restart nginx
```

### Auto-Renewal with Cron (Recommended)

```bash
# Edit crontab
sudo crontab -e

# Add this line to renew automatically (runs daily at 2 AM)
0 2 * * * certbot renew && cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /path/to/vyomai-app/certs/certificate.crt && cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /path/to/vyomai-app/certs/private.key && docker-compose -C /path/to/vyomai-app restart nginx
```

## Nginx Configuration Details

The `nginx.conf` file:

1. **Listens on:**
   - Port 80 (HTTP) → redirects to HTTPS
   - Port 443 (HTTPS) → serves securely

2. **Features:**
   - TLS 1.2 and 1.3 support
   - Gzip compression for faster loading
   - Security headers (HSTS, X-Frame-Options, etc.)
   - WebSocket support (for real-time features)
   - Proper proxy headers for IP logging

3. **SSL Settings:**
   - Strong ciphers
   - Session caching
   - Modern TLS versions only

## Troubleshooting

### Nginx Container Won't Start

```bash
# Check nginx configuration
docker-compose logs nginx

# Validate nginx config
docker-compose exec nginx nginx -t

# Common issues:
# - Certificate paths wrong (check nginx.conf)
# - Certificate files missing (check certs/ folder)
# - Port already in use
```

### Certificate Not Found Error

```bash
# Verify files exist
ls -la certs/

# Check nginx config paths
cat nginx.conf | grep ssl_certificate

# Rebuild containers
docker-compose down
docker-compose up -d
```

### Mixed Content Warning (Chrome/Firefox)

All resources must be loaded over HTTPS. This is usually automatic, but check:

```bash
# Check that app is using relative URLs
grep -r "http://" client/src/ server/

# Should be: /api/... or relative paths, not http://
```

### Self-Signed Certificate Warnings

**In Browser:** Click "Advanced" → "Proceed to site" (development only)

**In Terminal:**
```bash
# Curl with insecure flag
curl --insecure https://yourdomain.com

# For production, get a proper certificate from Let's Encrypt (free!)
```

## Security Best Practices

1. **Always use Let's Encrypt** for production (free and automatic)
2. **Keep certificates updated** - set up auto-renewal
3. **Use strong private keys** - don't share or expose
4. **Monitor certificate expiry** - set reminders 30 days before expiration
5. **Use HTTPS only** - redirect all HTTP traffic to HTTPS
6. **Enable security headers** - already configured in nginx.conf

## Performance Tips

1. **Enable HTTP/2** - Already configured in nginx.conf
2. **Enable Gzip compression** - Already configured
3. **Set proper cache headers** - Nginx handles static assets
4. **Monitor with:**
   ```bash
   docker stats
   docker-compose logs -f
   ```

## Testing HTTPS Connection

```bash
# From your browser
https://yourdomain.com

# From terminal
curl -v https://yourdomain.com

# Check certificate details
openssl s_client -connect yourdomain.com:443

# Check SSL Labs rating (online)
# https://www.ssllabs.com/ssltest/
```

## Rollback to HTTP Only

If you need to go back to HTTP (not recommended):

```bash
# Switch back to original docker-compose.yml
docker-compose -f docker-compose.yml down
docker-compose -f docker-compose.yml up -d
```

## Support & Resources

- Nginx Documentation: https://nginx.org/en/docs/
- Let's Encrypt: https://letsencrypt.org/
- SSL Labs: https://www.ssllabs.com/
- Mozilla SSL Configuration: https://ssl-config.mozilla.org/
