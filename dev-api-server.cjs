#!/usr/bin/env node

/**
 * Development API server to handle /api routes during development
 * This mimics Vercel's API handling for local development
 */

require('dotenv').config();

const http = require('http');
const url = require('url');
const path = require('path');

// Import API handlers
let chatHandler, knowledgeHandler, knowledgeSearchHandler;

// Load handlers function
async function loadHandlers() {
  try {
    chatHandler = (await import('./api/chat.js')).default;
    knowledgeHandler = (await import('./api/knowledge/index.js')).default;
    knowledgeSearchHandler = (await import('./api/knowledge/search.js')).default;
    
    console.log('✅ API handlers loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load API handlers:', error.message);
    process.exit(1);
  }
}

const PORT = 3001;

// Simple request/response wrapper to match Vercel's format
function createVercelRequest(req) {
  const parsedUrl = url.parse(req.url, true);
  
  return {
    method: req.method,
    url: req.url,
    query: parsedUrl.query,
    body: null, // Will be populated for POST requests
    headers: req.headers
  };
}

function createVercelResponse(res) {
  let statusCode = 200;
  let responseBody = '';
  let responseHeaders = { 'Content-Type': 'application/json' };

  const mockRes = {
    status: (code) => {
      statusCode = code;
      return mockRes;
    },
    json: (data) => {
      responseBody = JSON.stringify(data);
      responseHeaders['Content-Type'] = 'application/json';
      
      // Send the response immediately
      res.writeHead(statusCode, responseHeaders);
      res.end(responseBody);
    },
    setHeader: (key, value) => {
      responseHeaders[key] = value;
    },
    end: (data) => {
      if (data && typeof data === 'string') {
        responseBody = data;
      }
      res.writeHead(statusCode, responseHeaders);
      res.end(responseBody);
    }
  };

  return mockRes;
}

// Route handlers
function getRoutes() {
  return {
    '/api/chat': chatHandler.default || chatHandler,
    '/api/knowledge': knowledgeHandler.default || knowledgeHandler,
    '/api/knowledge/search': knowledgeSearchHandler.default || knowledgeSearchHandler
  };
}

// Handle dynamic routes like /api/knowledge/[id]
async function findHandler(pathname) {
  const routes = getRoutes();
  
  // Direct match
  if (routes[pathname]) {
    return routes[pathname];
  }
  
  // Check for dynamic routes
  if (pathname.startsWith('/api/knowledge/') && pathname !== '/api/knowledge/search') {
    // This is a dynamic route like /api/knowledge/123
    try {
      const knowledgeIdHandler = (await import('./api/knowledge/[id].js')).default;
      return knowledgeIdHandler;
    } catch (error) {
      console.error('Error loading dynamic route handler:', error);
      return null;
    }
  }
  
  return null;
}

// Parse request body for POST requests
function parseBody(req) {
  return new Promise((resolve) => {
    if (req.method !== 'POST' && req.method !== 'PUT') {
      resolve(null);
      return;
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        resolve(body);
      }
    });
  });
}

// Create server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  console.log(`${req.method} ${pathname}`);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Find appropriate handler
  const handler = await findHandler(pathname);
  
  if (!handler) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'API endpoint not found' }));
    return;
  }
  
  try {
    // Parse request body
    const body = await parseBody(req);
    
    // Create Vercel-like request object
    const vercelReq = createVercelRequest(req);
    vercelReq.body = body;
    
    // Extract dynamic route parameters
    if (pathname.startsWith('/api/knowledge/') && pathname !== '/api/knowledge/search') {
      const id = pathname.split('/').pop();
      vercelReq.query.id = id;
    }
    
    // Create Vercel-like response object
    const vercelRes = createVercelResponse(res);
    
    // Call the handler
    await handler(vercelReq, vercelRes);
    
  } catch (error) {
    console.error('API Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }));
  }
});

// Initialize and start server
async function startServer() {
  await loadHandlers();
  
  server.listen(PORT, () => {
    console.log(`🚀 Development API server running on http://localhost:${PORT}`);
    console.log('   Available endpoints:');
    console.log('   - POST /api/chat');
    console.log('   - GET/POST /api/knowledge');
    console.log('   - GET /api/knowledge/search');
    console.log('   - GET/PUT/DELETE /api/knowledge/[id]');
  });
}

startServer();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down API server...');
  server.close(() => {
    process.exit(0);
  });
});