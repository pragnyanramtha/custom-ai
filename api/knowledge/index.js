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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    initializeKnowledgeBase();

    switch (req.httpMethod) {
      case 'GET':
        return await handleGetEntries(req, headers);
      case 'POST':
        return await handleCreateEntry(req, headers);
      default:
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
  } catch (error) {
    console.error('Knowledge Base API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: true,
        message: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      })
    };
  }
}

async function handleGetEntries(req, headers) {
  const { q: query, limit } = req.queryStringParameters;

  try {
    let entries;
    
    if (query) {
      const searchLimit = limit ? parseInt(limit) : 10;
      entries = await knowledgeBase.searchEntries(query, searchLimit);
    } else {
      entries = await knowledgeBase.getAllEntries();
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        entries,
        total: entries.length,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Error retrieving entries:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: true,
        message: 'Failed to retrieve knowledge entries',
        code: 'RETRIEVAL_ERROR'
      })
    };
  }
}

async function handleCreateEntry(req, headers) {
  const { key, value, tags } = JSON.parse(req.body);

  if (!key || typeof key !== 'string' || key.trim() === '') {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: true,
        message: 'Key is required and must be a non-empty string',
        code: 'INVALID_KEY'
      })
    };
  }

  if (!value || typeof value !== 'string' || value.trim() === '') {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: true,
        message: 'Value is required and must be a non-empty string',
        code: 'INVALID_VALUE'
      })
    };
  }

  try {
    const newEntry = await knowledgeBase.createEntry(
      key.trim(),
      value.trim(),
      tags || []
    );

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        entry: newEntry,
        message: 'Knowledge entry created successfully',
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Error creating entry:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: true,
        message: 'Failed to create knowledge entry',
        code: 'CREATION_ERROR'
      })
    };
  }
}
