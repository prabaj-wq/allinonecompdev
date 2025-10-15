# Deployment Guide

## CORS Configuration

This application is now configured to work anywhere without URL restrictions. Here's how to configure it for different environments:

### Development (Default)
By default, the app allows all origins (`*`) which works for local development and testing.

### Production Deployment

#### 1. Environment Variables
Set the `CORS_ORIGINS` environment variable based on your hosting platform:

```bash
# For a single domain
CORS_ORIGINS=https://yourdomain.com

# For multiple domains (comma-separated)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://app.yourdomain.com
```

#### 2. Platform-Specific Examples

**Netlify:**
```bash
CORS_ORIGINS=https://your-app.netlify.app,https://your-app-branch.netlify.app
```

**Vercel:**
```bash
CORS_ORIGINS=https://your-app.vercel.app,https://your-app-git-main.vercel.app
```

**Heroku:**
```bash
CORS_ORIGINS=https://your-app.herokuapp.com
```

**GitHub Codespaces:**
```bash
CORS_ORIGINS=https://your-codespace-name-3000.app.github.dev,https://your-codespace-name-80.app.github.dev
```

**Custom Domain:**
```bash
CORS_ORIGINS=https://yourdomain.com,https://api.yourdomain.com
```

#### 3. Docker Deployment
```dockerfile
ENV CORS_ORIGINS=https://yourdomain.com
ENV FRONTEND_URL=https://yourdomain.com
```

#### 4. Railway/Render
Set environment variables in your platform's dashboard:
- `CORS_ORIGINS`: Your frontend URLs
- `FRONTEND_URL`: Your main frontend URL

### Security Notes

1. **Never use `*` in production** - it allows any website to access your API
2. **Always use HTTPS in production** - HTTP origins should only be used for local development
3. **Include all necessary subdomains** - www, api, app, etc.
4. **Update CORS_ORIGINS when changing domains** - Don't forget to update when moving to new URLs

### Quick Setup Commands

**For Development:**
```bash
# No environment variables needed - defaults to allow all origins
npm run dev
```

**For Production:**
```bash
# Set your production URLs
export CORS_ORIGINS=https://yourdomain.com
export FRONTEND_URL=https://yourdomain.com
export ENVIRONMENT=production
npm start
```

### Troubleshooting

If you get CORS errors:
1. Check that your frontend URL is included in `CORS_ORIGINS`
2. Ensure URLs match exactly (including https/http and ports)
3. Check browser console for the exact blocked URL
4. Add the blocked URL to `CORS_ORIGINS`

### Testing CORS Configuration

You can test your CORS configuration by making a request from your browser console:
```javascript
fetch('https://your-api-domain.com/api/health')
  .then(response => response.json())
  .then(data => console.log('CORS working:', data))
  .catch(error => console.error('CORS error:', error))
```
