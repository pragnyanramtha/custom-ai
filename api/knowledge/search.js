import KnowledgeBase from '../../lib/knowledgeBase.js';

let knowledgeBase;

function initializeKnowledgeBase() {
  if (!knowledgeBase) {
    knowledgeBase = new KnowledgeBase();
  }
}

export default async function handler(req) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (req.method !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        error: true, 
        message: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED'
      })
    };
  }

  const { q: query, limit } = req.queryStringParameters;

  if (!query || query.trim() === '') {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: true,
        message: 'Search query is required',
        code: 'MISSING_QUERY'
      })
    };
  }

  try {
    initializeKnowledgeBase();

    const searchLimit = limit ? parseInt(limit) : 10;
    const results = await knowledgeBase.searchEntries(query, searchLimit);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        query: query.trim(),
        results,
        total: results.length,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Search API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: true,
        message: 'Search operation failed',
        code: 'SEARCH_ERROR',
        timestamp: new Date().toISOString()
      })
    };
  }
}
