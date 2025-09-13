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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    initializeKnowledgeBase();

    switch (req.method) {
      case 'GET':
        return await handleGetEntries(req, res);
      case 'POST':
        return await handleCreateEntry(req, res);
      default:
        return res.status(405).json({ 
          error: true, 
          message: 'Method not allowed',
          code: 'METHOD_NOT_ALLOWED'
        });
    }
  } catch (error) {
    console.error('Knowledge Base API Error:', error);
    return res.status(500).json({
      error: true,
      message: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Handle GET requests - retrieve all entries or search
 */
async function handleGetEntries(req, res) {
  const { q: query, limit } = req.query;

  try {
    let entries;
    
    if (query) {
      // Search entries
      const searchLimit = limit ? parseInt(limit) : 10;
      entries = await knowledgeBase.searchEntries(query, searchLimit);
    } else {
      // Get all entries
      entries = await knowledgeBase.getAllEntries();
    }

    return res.status(200).json({
      entries,
      total: entries.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error retrieving entries:', error);
    return res.status(500).json({
      error: true,
      message: 'Failed to retrieve knowledge entries',
      code: 'RETRIEVAL_ERROR'
    });
  }
}

/**
 * Handle POST requests - create new entry
 */
async function handleCreateEntry(req, res) {
  const { key, value, tags } = req.body;

  // Validate input
  if (!key || typeof key !== 'string' || key.trim() === '') {
    return res.status(400).json({
      error: true,
      message: 'Key is required and must be a non-empty string',
      code: 'INVALID_KEY'
    });
  }

  if (!value || typeof value !== 'string' || value.trim() === '') {
    return res.status(400).json({
      error: true,
      message: 'Value is required and must be a non-empty string',
      code: 'INVALID_VALUE'
    });
  }

  try {
    const newEntry = await knowledgeBase.createEntry(
      key.trim(),
      value.trim(),
      tags || []
    );

    return res.status(201).json({
      entry: newEntry,
      message: 'Knowledge entry created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating entry:', error);
    return res.status(500).json({
      error: true,
      message: 'Failed to create knowledge entry',
      code: 'CREATION_ERROR'
    });
  }
}