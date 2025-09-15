import GeminiService from '../lib/geminiService.js';
import KnowledgeBase from '../lib/knowledgeBase.js';

// Initialize services
let geminiService;
let knowledgeBase;
const chatHistories = {};

function initializeServices() {
  if (!geminiService) {
    geminiService = new GeminiService();
  }
  if (!knowledgeBase) {
    knowledgeBase = new KnowledgeBase();
  }
}

export default async function handler(req) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (req.method !== 'POST') {
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

  try {
    initializeServices();

    const { message, sessionId } = JSON.parse(req.body);

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: true,
          message: 'Message is required and must be a non-empty string',
          code: 'INVALID_MESSAGE'
        })
      };
    }

    const userMessage = message.trim();
    const chatSessionId = sessionId || generateSessionId();

    const history = chatHistories[chatSessionId] || [];

    const knowledgeContext = await knowledgeBase.getRelevantContext(userMessage, 3);
    
    const aiResult = await geminiService.generateChatResponse(userMessage, history, knowledgeContext);

    chatHistories[chatSessionId] = [
      ...history,
      { role: "user", parts: [{ text: userMessage }] },
      { role: "model", parts: [{ text: aiResult.response }] },
    ];

    const response = {
      response: aiResult.response,
      timestamp: new Date().toISOString(),
      sessionId: chatSessionId,
      modelUsed: aiResult.modelUsed,
      tier: aiResult.tier,
      knowledgeUsed: knowledgeContext ? true : false
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Chat API Error:', error);

    if (error.message.includes('All Gemini model tiers have reached their limits')) {
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({
          error: true,
          message: 'AI service is temporarily unavailable due to usage limits. Please try again later.',
          code: 'SERVICE_UNAVAILABLE',
          retryAfter: 3600
        })
      };
    }

    if (error.message.includes('GEMINI_API_KEY')) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: true,
          message: 'AI service configuration error. Please contact support.',
          code: 'CONFIGURATION_ERROR'
        })
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: true,
        message: 'An unexpected error occurred. Please try again.',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      })
    };
  }
}

function generateSessionId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
