import GeminiService from '../lib/geminiService.js';
import KnowledgeBase from '../lib/knowledgeBase.js';

// Initialize services
let geminiService;
let knowledgeBase;

function initializeServices() {
  if (!geminiService) {
    geminiService = new GeminiService();
  }
  if (!knowledgeBase) {
    knowledgeBase = new KnowledgeBase();
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: true, 
      message: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED'
    });
  }

  try {
    initializeServices();

    const { message, sessionId } = req.body;

    // Validate input
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        error: true,
        message: 'Message is required and must be a non-empty string',
        code: 'INVALID_MESSAGE'
      });
    }

    const userMessage = message.trim();
    const chatSessionId = sessionId || generateSessionId();

    // Search knowledge base for relevant context
    const knowledgeContext = await knowledgeBase.getRelevantContext(userMessage, 3);
    
    // Generate AI response
    const aiResult = await geminiService.generateResponse(userMessage, knowledgeContext);

    // Prepare response
    const response = {
      response: aiResult.response,
      timestamp: new Date().toISOString(),
      sessionId: chatSessionId,
      modelUsed: aiResult.modelUsed,
      tier: aiResult.tier,
      knowledgeUsed: knowledgeContext ? true : false
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Chat API Error:', error);

    // Handle specific error types
    if (error.message.includes('All Gemini model tiers have reached their limits')) {
      return res.status(503).json({
        error: true,
        message: 'AI service is temporarily unavailable due to usage limits. Please try again later.',
        code: 'SERVICE_UNAVAILABLE',
        retryAfter: 3600 // 1 hour
      });
    }

    if (error.message.includes('GEMINI_API_KEY')) {
      return res.status(500).json({
        error: true,
        message: 'AI service configuration error. Please contact support.',
        code: 'CONFIGURATION_ERROR'
      });
    }

    // Generic error response
    return res.status(500).json({
      error: true,
      message: 'An unexpected error occurred. Please try again.',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Generate a unique session ID
 */
function generateSessionId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}