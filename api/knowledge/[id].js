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
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      error: true,
      message: 'Entry ID is required',
      code: 'MISSING_ID'
    });
  }

  try {
    initializeKnowledgeBase();

    switch (req.method) {
      case 'GET':
        return await handleGetEntry(req, res, id);
      case 'PUT':
        return await handleUpdateEntry(req, res, id);
      case 'DELETE':
        return await handleDeleteEntry(req, res, id);
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
 * Handle GET requests - retrieve specific entry
 */
async function handleGetEntry(req, res, id) {
  try {
    const entry = await knowledgeBase.getEntryById(id);
    
    if (!entry) {
      return res.status(404).json({
        error: true,
        message: 'Knowledge entry not found',
        code: 'ENTRY_NOT_FOUND'
      });
    }

    return res.status(200).json({
      entry,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error retrieving entry:', error);
    return res.status(500).json({
      error: true,
      message: 'Failed to retrieve knowledge entry',
      code: 'RETRIEVAL_ERROR'
    });
  }
}

/**
 * Handle PUT requests - update entry
 */
async function handleUpdateEntry(req, res, id) {
  const { key, value, tags } = req.body;

  // Validate input
  const updates = {};
  
  if (key !== undefined) {
    if (typeof key !== 'string' || key.trim() === '') {
      return res.status(400).json({
        error: true,
        message: 'Key must be a non-empty string',
        code: 'INVALID_KEY'
      });
    }
    updates.key = key.trim();
  }

  if (value !== undefined) {
    if (typeof value !== 'string' || value.trim() === '') {
      return res.status(400).json({
        error: true,
        message: 'Value must be a non-empty string',
        code: 'INVALID_VALUE'
      });
    }
    updates.value = value.trim();
  }

  if (tags !== undefined) {
    if (!Array.isArray(tags)) {
      return res.status(400).json({
        error: true,
        message: 'Tags must be an array',
        code: 'INVALID_TAGS'
      });
    }
    updates.tags = tags;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      error: true,
      message: 'At least one field (key, value, or tags) must be provided for update',
      code: 'NO_UPDATE_DATA'
    });
  }

  try {
    const updatedEntry = await knowledgeBase.updateEntry(id, updates);
    
    return res.status(200).json({
      entry: updatedEntry,
      message: 'Knowledge entry updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: true,
        message: 'Knowledge entry not found',
        code: 'ENTRY_NOT_FOUND'
      });
    }

    console.error('Error updating entry:', error);
    return res.status(500).json({
      error: true,
      message: 'Failed to update knowledge entry',
      code: 'UPDATE_ERROR'
    });
  }
}

/**
 * Handle DELETE requests - delete entry
 */
async function handleDeleteEntry(req, res, id) {
  try {
    const deletedEntry = await knowledgeBase.deleteEntry(id);
    
    return res.status(200).json({
      entry: deletedEntry,
      message: 'Knowledge entry deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: true,
        message: 'Knowledge entry not found',
        code: 'ENTRY_NOT_FOUND'
      });
    }

    console.error('Error deleting entry:', error);
    return res.status(500).json({
      error: true,
      message: 'Failed to delete knowledge entry',
      code: 'DELETE_ERROR'
    });
  }
}