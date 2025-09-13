# Deployment Guide

This guide provides comprehensive instructions for deploying the AI Customer Support Chatbot to various environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Local Development](#local-development)
- [Vercel Deployment](#vercel-deployment)
- [Environment Variables](#environment-variables)
- [Health Monitoring](#health-monitoring)
- [Backup & Recovery](#backup--recovery)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software
- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download](https://git-scm.com/)

### Required Accounts
- **Google Account** - For Gemini API access
- **Vercel Account** - For deployment (free tier available)

### API Keys
- **Google Gemini API Key** - Get from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Environment Setup

### 1. Clone Repository

```bash
git clone <your-repository-url>
cd ai-customer-support-chatbot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create environment files:

```bash
# For local development
cp .env.local.example .env.local

# Edit .env.local with your API key
GEMINI_API_KEY=your_google_gemini_api_key_here
NODE_ENV=development
```

### 4. Verify Setup

```bash
# Run validation script
npm run validate
```

## Local Development

### Start Development Server

```bash
# Using npm script
npm run dev

# Or using Vercel CLI directly
vercel dev
```

The application will be available at `http://localhost:3000`

### Development URLs
- **Chat Interface**: `http://localhost:3000`
- **Admin Interface**: `http://localhost:3000/admin.html`
- **API Endpoints**: `http://localhost:3000/api/*`

### Testing Locally

```bash
# Run all tests
npm test

# Validate deployment
npm run validate

# Health check
npm run health-check http://localhost:3000
```

## Vercel Deployment

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Deploy to Preview

```bash
# Deploy to preview environment
npm run deploy:preview
```

### 4. Deploy to Production

```bash
# Deploy to production
npm run deploy
```

### 5. Configure Environment Variables

#### Via Vercel Dashboard:
1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `GEMINI_API_KEY` | Your Google Gemini API key | Production, Preview |
| `NODE_ENV` | `production` | Production |

#### Via Vercel CLI:
```bash
# Add environment variable
vercel env add GEMINI_API_KEY

# Pull environment variables to local
npm run env:pull
```

### 6. Verify Deployment

```bash
# Health check production deployment
npm run health-check https://your-app.vercel.app

# View deployment logs
npm run logs
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | `AIzaSy...` |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `NODE_ENV` | Environment mode | `production` | `development` |

### Getting API Keys

#### Google Gemini API Key:
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the generated key
5. **Important**: Keep this key secure and never commit it to version control

## Health Monitoring

### Automated Health Checks

```bash
# Check application health
npm run health-check https://your-app.vercel.app

# Validate deployment configuration
npm run validate
```

### Health Check Endpoints

The health check script monitors:
- **API Endpoints** - Response time and functionality
- **Knowledge Base** - Data integrity and search functionality
- **AI Service** - Gemini API connectivity and model status
- **Frontend** - Page loading and interface availability

### Monitoring Results

Health check returns one of three statuses:
- 🟢 **Healthy** - All systems operational
- 🟡 **Degraded** - Some issues but functional
- 🔴 **Unhealthy** - Critical issues requiring attention

### Setting Up Monitoring

For production environments, consider setting up automated monitoring:

```bash
# Add to crontab for regular health checks
*/15 * * * * cd /path/to/project && npm run health-check https://your-app.vercel.app
```

## Backup & Recovery

### Knowledge Base Backup

```bash
# Create backup
npm run backup-kb

# List existing backups
npm run backup-kb list

# Restore from backup
npm run restore-kb knowledge-base-backup-2024-01-15T10-30-00-000Z.json
```

### Backup Strategy

- **Automatic**: Backups are created before any restore operation
- **Retention**: Last 10 backups are kept automatically
- **Format**: JSON with metadata and timestamp
- **Location**: `./backups/` directory

### Backup Contents

Each backup includes:
- Complete knowledge base data
- Entry count and metadata
- Backup timestamp
- Version information

## Troubleshooting

### Common Issues

#### 1. "GEMINI_API_KEY environment variable is required"

**Cause**: Missing or incorrectly set API key

**Solution**:
```bash
# Check if variable is set
echo $GEMINI_API_KEY

# Set in .env.local for development
echo "GEMINI_API_KEY=your_key_here" >> .env.local

# Set in Vercel dashboard for production
vercel env add GEMINI_API_KEY
```

#### 2. "All Gemini model tiers have reached their limits"

**Cause**: API quota exceeded

**Solutions**:
- Wait for quota reset (usually 24 hours)
- Upgrade to paid Gemini API plan
- Check usage in [Google AI Studio](https://makersuite.google.com/)

#### 3. Deployment Fails

**Diagnosis**:
```bash
# Check deployment logs
npm run logs

# Validate configuration
npm run validate

# Test locally first
npm run dev
```

**Common fixes**:
- Verify all environment variables are set
- Check for syntax errors in code
- Ensure all dependencies are installed
- Validate JSON files (knowledge-base.json)

#### 4. API Endpoints Not Working

**Diagnosis**:
```bash
# Test specific endpoint
curl -X POST https://your-app.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}'

# Check health
npm run health-check https://your-app.vercel.app
```

**Solutions**:
- Verify Vercel function configuration
- Check API route file paths
- Validate request/response formats
- Review function logs in Vercel dashboard

#### 5. Knowledge Base Issues

**Symptoms**:
- Search not working
- Entries not saving
- Data corruption

**Solutions**:
```bash
# Validate knowledge base format
node -e "console.log(JSON.parse(require('fs').readFileSync('data/knowledge-base.json')))"

# Restore from backup
npm run restore-kb <backup-file>

# Reset to empty state
echo "[]" > data/knowledge-base.json
```

### Performance Issues

#### Slow Response Times

**Diagnosis**:
- Check health check response times
- Monitor Vercel function execution time
- Test Gemini API directly

**Solutions**:
- Optimize knowledge base size
- Implement caching strategies
- Consider upgrading Vercel plan
- Use faster Gemini model tiers

#### High Memory Usage

**Solutions**:
- Limit knowledge base size
- Implement pagination for large datasets
- Optimize JSON parsing
- Monitor Vercel function memory usage

### Getting Help

#### Debug Information

When reporting issues, include:

```bash
# System information
node --version
npm --version

# Health check results
npm run health-check https://your-app.vercel.app

# Validation results
npm run validate

# Recent logs
npm run logs
```

#### Support Channels

1. **GitHub Issues** - For bugs and feature requests
2. **Vercel Support** - For deployment issues
3. **Google AI Support** - For Gemini API issues

## Security Considerations

### API Key Security

- ✅ Store API keys in environment variables
- ✅ Use Vercel's encrypted environment variables
- ❌ Never commit API keys to version control
- ❌ Never expose API keys in client-side code

### CORS Configuration

The application includes proper CORS headers for:
- API endpoint access
- Cross-origin requests
- Security headers (XSS protection, content type options)

### Data Privacy

- Knowledge base data is stored locally (JSON file)
- Chat history is stored in browser localStorage
- No sensitive data is transmitted to external services (except Gemini API for responses)

## Scaling Considerations

### Vercel Limits

**Free Tier**:
- 100GB bandwidth/month
- 100 serverless function invocations/day
- 10 second function timeout

**Pro Tier**:
- 1TB bandwidth/month
- Unlimited function invocations
- 60 second function timeout

### Knowledge Base Scaling

- Current implementation supports up to 1000 entries efficiently
- For larger datasets, consider:
  - Database integration (PostgreSQL, MongoDB)
  - Search service (Elasticsearch, Algolia)
  - Caching layer (Redis)

### AI Service Scaling

- Monitor Gemini API usage and quotas
- Consider implementing request queuing for high traffic
- Use multiple API keys for load distribution
- Implement response caching for common queries

## Maintenance

### Regular Tasks

```bash
# Weekly health checks
npm run health-check https://your-app.vercel.app

# Monthly knowledge base backups
npm run backup-kb

# Quarterly dependency updates
npm audit
npm update
```

### Monitoring Checklist

- [ ] API response times < 5 seconds
- [ ] Knowledge base search working
- [ ] All Gemini model tiers accessible
- [ ] Frontend loading correctly
- [ ] Backup system functioning
- [ ] Environment variables secure
- [ ] No critical security vulnerabilities

### Update Process

1. **Test locally** with `npm run dev`
2. **Validate** with `npm run validate`
3. **Deploy to preview** with `npm run deploy:preview`
4. **Test preview environment**
5. **Deploy to production** with `npm run deploy`
6. **Verify production** with health check

This deployment guide ensures reliable, secure, and scalable deployment of your AI Customer Support Chatbot.