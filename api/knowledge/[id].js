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
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  const { id } = req.queryStringParameters;

  if (!id) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: true,
        message: 'Entry ID is required',
        code: 'MISSING_ID'
      })
    };
  }

  try {
    initializeKnowledgeBase();

    switch (req.httpMethod) {
      case 'GET':
        return await handleGetEntry(req, id, headers);
      case 'PUT':
        return await handleUpdateEntry(req, id, headers);
      case 'DELETE':
        return await handleDeleteEntry(req, id, headers);
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

async function handleGetEntry(req, id, headers) {
  try {
    const entry = await knowledgeBase.getEntryById(id);
    
    if (!entry) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: true,
          message: 'Knowledge entry not found',
          code: 'ENTRY_NOT_FOUND'
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        entry,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Error retrieving entry:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: true,
        message: 'Failed to retrieve knowledge entry',
        code: 'RETRIEVAL_ERROR'
      })
    };
  }
}

async function handleUpdateEntry(req, id, headers) {
  const { key, value, tags } = JSON.parse(req.body);

  const updates = {};
  
  if (key !== undefined) {
    if (typeof key !== 'string' || key.trim() === '') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: true,
          message: 'Key must be a non-empty string',
          code: 'INVALID_KEY'
        })
      };
    }
    updates.key = key.trim();
  }

  if (value !== undefined) {
    if (typeof value !== 'string' || value.trim() === '') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: true,
          message: 'Value must be a non-empty string',
          code: 'INVALID_VALUE'
        })
      };
    }
    updates.value = value.trim();
  }

  if (tags !== undefined) {
    if (!Array.isArray(tags)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: true,
          message: 'Tags must be an array',
          code: 'INVALID_TAGS'
        })
      };
    }
    updates.tags = tags;
  }

  if (Object.keys(updates).length === 0) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: true,
        message: 'At least one field (key, value, or tags) must be provided for update',
        code: 'NO_UPDATE_DATA'
      })
    };
  }

  try {
    const updatedEntry = await knowledgeBase.updateEntry(id, updates);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        entry: updatedEntry,
        message: 'Knowledge entry updated successfully',
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    if (error.message.includes('not found')) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: true,
          message: 'Knowledge entry not found',
          code: 'ENTRY_NOT_FOUND'
        })
      };
    }

    console.error('Error updating entry:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: true,
        message: 'Failed to update knowledge entry',
        code: 'UPDATE_ERROR'
      })
    };
  }
}

async function handleDeleteEntry(req, id, headers) {
  try {
    const deletedEntry = await knowledgeBase.deleteEntry(id);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        entry: deletedEntry,
        message: 'Knowledge entry deleted successfully',
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    if (error.message.includes('not found')) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: true,
          message: 'Knowledge entry not found',
          code: 'ENTRY_NOT_FOUND'
        })
      };
    }

    console.error('Error deleting entry:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: true,
        message: 'Failed to delete knowledge entry',
        code: 'DELETE_ERROR'
      })
    };
  }
}
