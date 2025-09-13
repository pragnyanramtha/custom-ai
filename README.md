# AI Customer Support Chatbot

A complete AI-powered customer support chatbot system for architectural companies, built with Vercel API routes and Google Gemini AI.

## Features

- 🤖 AI-powered responses using Google Gemini with automatic model tier switching
- 📚 Searchable knowledge base management
- 💬 Real-time chat interface
- 📱 Mobile-responsive design
- 🔄 Automatic fallback between Gemini model tiers
- 💾 Local JSON-based knowledge storage
- 🚀 Serverless deployment on Vercel

## Quick Start

### Prerequisites

- Node.js 18+ installed
- Google Gemini API key
- Vercel account (for deployment)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd ai-customer-support-chatbot
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

**Getting a Gemini API Key:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key

### 3. Local Development

```bash
# Install Vercel CLI globally (if not already installed)
npm install -g vercel

# Start local development server
vercel dev
```

The application will be available at `http://localhost:3000`

### 4. Deploy to Vercel

```bash
# Login to Vercel (first time only)
vercel login

# Deploy to production
vercel --prod
```

**Setting Environment Variables in Vercel:**
1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add `GEMINI_API_KEY` with your API key
5. Redeploy the project

## API Endpoints

### Chat API
- **POST** `/api/chat`
  - Send messages and get AI responses
  - Automatically searches knowledge base for context
  - Handles model tier switching

```javascript
// Request
{
  "message": "What are your pricing rates?",
  "sessionId": "optional-session-id"
}

// Response
{
  "response": "Our architectural services start at $150/hour...",
  "timestamp": "2024-01-15T10:30:00Z",
  "sessionId": "generated-session-id",
  "modelUsed": "gemini-2.0-flash-exp",
  "tier": "pro",
  "knowledgeUsed": true
}
```

### Knowledge Base API

#### Get All Entries
- **GET** `/api/knowledge`

#### Search Entries
- **GET** `/api/knowledge?q=search-term&limit=10`
- **GET** `/api/knowledge/search?q=search-term&limit=10`

#### Create Entry
- **POST** `/api/knowledge`
```javascript
{
  "key": "Service Pricing",
  "value": "Our services start at $150/hour...",
  "tags": ["pricing", "services"]
}
```

#### Get Specific Entry
- **GET** `/api/knowledge/[id]`

#### Update Entry
- **PUT** `/api/knowledge/[id]`
```javascript
{
  "key": "Updated Service Pricing",
  "value": "Updated pricing information...",
  "tags": ["pricing", "services", "updated"]
}
```

#### Delete Entry
- **DELETE** `/api/knowledge/[id]`

## Project Structure

```
├── api/
│   ├── chat.js                 # Main chat endpoint
│   └── knowledge/
│       ├── index.js           # Knowledge CRUD operations
│       ├── [id].js            # Individual entry operations
│       └── search.js          # Search functionality
├── lib/
│   ├── geminiService.js       # Gemini AI integration
│   ├── knowledgeBase.js       # Knowledge base operations
│   └── utils.js               # Utility functions
├── data/
│   └── knowledge-base.json    # Knowledge storage
├── package.json
├── vercel.json               # Vercel configuration
└── README.md
```

## Configuration

### Vercel Configuration (`vercel.json`)

```json
{
  "functions": {
    "api/**/*.js": {
      "runtime": "@vercel/node@3.0.0"
    }
  },
  "env": {
    "GEMINI_API_KEY": "@gemini_api_key"
  }
}
```

### Gemini Model Tier Configuration

The system automatically switches between Gemini models when rate limits are reached:

1. **Primary**: `gemini-2.0-flash-exp` (highest quality)
2. **Fallback**: `gemini-1.5-flash` (balanced performance)
3. **Final**: `gemini-1.5-flash-8b` (fastest, basic responses)

## Knowledge Base Management

### Adding Knowledge Entries

Use the API or directly edit `data/knowledge-base.json`:

```json
{
  "id": "unique-id",
  "key": "Topic Title",
  "value": "Detailed information about the topic...",
  "tags": ["tag1", "tag2"],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Search Algorithm

The knowledge base uses a scoring system:
- Exact key match: 100 points
- Key contains search term: 50 points
- Tag exact match: 40 points
- Value contains search term: 20 points
- Partial word matches: 10 points

## Error Handling

### API Rate Limits
- Automatic model switching when limits are reached
- Graceful error messages to users
- Retry logic with exponential backoff

### Common Error Codes
- `METHOD_NOT_ALLOWED`: Wrong HTTP method
- `INVALID_MESSAGE`: Missing or empty message
- `SERVICE_UNAVAILABLE`: All AI models at limit
- `CONFIGURATION_ERROR`: Missing API key
- `ENTRY_NOT_FOUND`: Knowledge entry doesn't exist

## Monitoring and Debugging

### Logs
- Check Vercel function logs in the dashboard
- Console logs for debugging API calls
- Error tracking for failed requests

### Performance
- Response times typically under 5 seconds
- Knowledge base searches are optimized for up to 1000 entries
- Serverless functions auto-scale with demand

## Customization

### Adding New Model Tiers
Edit `lib/geminiService.js`:

```javascript
this.modelTiers = [
  { name: 'gemini-2.0-flash-exp', tier: 'pro' },
  { name: 'gemini-1.5-flash', tier: 'flash' },
  { name: 'gemini-1.5-flash-8b', tier: 'flash-lite' },
  // Add new models here
];
```

### Customizing AI Responses
Modify the system prompt in `geminiService.js`:

```javascript
const systemInstructions = `You are a helpful AI assistant for an architectural company...`;
```

## Error Handling & Reliability

### Automatic Error Recovery

The system includes comprehensive error handling:

- **API Fallbacks**: Automatic switching between Gemini model tiers when limits are reached
- **Retry Logic**: Exponential backoff for network failures and temporary errors
- **Data Recovery**: Automatic backup and recovery for corrupted knowledge base files
- **Connection Monitoring**: Real-time network status detection and user feedback

### Deployment Scripts

```bash
# Validate deployment configuration
npm run validate

# Health check deployed application
npm run health-check https://your-app.vercel.app

# Create knowledge base backup
npm run backup-kb

# Restore from backup
npm run restore-kb <backup-filename>
```

## Troubleshooting

### Common Issues

1. **"GEMINI_API_KEY environment variable is required"**
   - Ensure API key is set in `.env.local` (local) or Vercel dashboard (production)
   - Verify API key format starts with "AIza"

2. **"All Gemini model tiers have reached their limits"**
   - Wait for quota reset (usually 24 hours)
   - Consider upgrading to paid Gemini API plan
   - Check usage in Google AI Studio

3. **Knowledge base not updating**
   - Run `npm run validate` to check file integrity
   - Check file permissions on `data/knowledge-base.json`
   - Verify API endpoints with health check
   - Restore from backup if corrupted

4. **Slow response times**
   - Run health check to measure response times
   - Check Gemini API status
   - Optimize knowledge base size (recommended < 1000 entries)
   - Monitor Vercel function execution time

5. **Deployment failures**
   - Run `npm run validate` before deploying
   - Check Vercel function logs: `npm run logs`
   - Verify all environment variables are set
   - Test locally first with `npm run dev`

### Diagnostic Tools

```bash
# Complete system validation
npm run validate

# Health monitoring
npm run health-check https://your-app.vercel.app

# View deployment logs
npm run logs

# Test API endpoints locally
npm test
```

### Support

For technical support or questions:
1. Run diagnostic tools and include output
2. Check the API logs in Vercel dashboard
3. Test individual endpoints using tools like Postman
4. Verify environment variables are correctly set
5. Check Google AI Studio for API quota status

See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive deployment and troubleshooting guide.

## License

This project is licensed under the MIT License.