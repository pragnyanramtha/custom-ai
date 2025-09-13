const KnowledgeBase = require('../../lib/knowledgeBase');

// Initialize knowledge base
let knowledgeBase;

function initializeKnowledgeBase() {
  if (!knowledgeBase) {
    knowledgeBase = new KnowledgeBase();
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: true, 
      message: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED'
    });
  }

  const { q: query, limit } = req.query;

  if (!query || query.trim() === '') {
    return res.status(400).json({
      error: true,
      message: 'Search query is required',
      code: 'MISSING_QUERY'
    });
  }

  try {
    initializeKnowledgeBase();

    const searchLimit = limit ? parseInt(limit) : 10;
    const results = await knowledgeBase.searchEntries(query, searchLimit);

    return res.status(200).json({
      query: query.trim(),
      results,
      total: results.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Search API Error:', error);
    return res.status(500).json({
      error: true,
      message: 'Search operation failed',
      code: 'SEARCH_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}