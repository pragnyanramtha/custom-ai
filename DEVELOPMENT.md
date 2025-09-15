# Development Setup

## Quick Start

For the full React app with working API endpoints:

```bash
# Option 1: Use Vercel Dev (Recommended)
vercel dev

# Option 2: Manual setup (if Vercel dev has issues)
# Terminal 1: Start API server
node dev-api-server.cjs

# Terminal 2: Start React app
npm run dev:vite
```

## Current Status

✅ **React Components**: Fully implemented and working
✅ **Build Process**: Working correctly (`npm run build`)
✅ **Deployment Config**: Ready for production
⚠️ **Development API**: Needs proper setup for local testing

## Development Options

### Option 1: Vercel Dev (Recommended)
```bash
vercel dev
```
This runs both the React app and API endpoints together, just like in production.

### Option 2: Frontend Only
```bash
npm run dev:vite
```
This runs only the React frontend. API calls will show helpful error messages.

### Option 3: Production Build Test
```bash
npm run build
npm run preview
```
Test the production build locally.

## API Endpoints

When the API server is running, these endpoints are available:

- `POST /api/chat` - Chat with AI
- `GET /api/knowledge` - List knowledge entries
- `POST /api/knowledge` - Create knowledge entry
- `GET /api/knowledge/search?q=query` - Search knowledge
- `GET/PUT/DELETE /api/knowledge/[id]` - Manage specific entry

## Environment Variables

Make sure `.env` file exists with:
```
GEMINI_API_KEY=your_api_key_here
NODE_ENV=development
```

## Troubleshooting

### "API server is not running" error
- Make sure you're using `vercel dev` or have started the API server separately
- Check that port 3001 is not in use by another process

### Build errors
- Run `npm run validate:react` to check configuration
- Make sure all dependencies are installed: `npm install`

### Vercel dev recursive error
- This is a known issue with the current setup
- Use the manual two-server approach as a workaround

## Production Deployment

```bash
# Validate everything is ready
npm run validate:react

# Deploy to Vercel
npm run deploy
```

The React transformation maintains 100% API compatibility with the original HTML version while providing a modern ChatGPT-style interface.