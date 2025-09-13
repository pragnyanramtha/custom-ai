const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    
    // Model tier configuration with fallback order
    this.modelTiers = [
      { name: 'gemini-2.0-flash-exp', tier: 'pro' },
      { name: 'gemini-1.5-flash', tier: 'flash' },
      { name: 'gemini-1.5-flash-8b', tier: 'flash-lite' }
    ];
    
    this.currentModelIndex = 0;
    this.lastFailureTime = null;
    this.retryDelay = 60000; // 1 minute retry delay
  }

  /**
   * Get the current model instance
   */
  getCurrentModel() {
    const currentTier = this.modelTiers[this.currentModelIndex];
    return this.genAI.getGenerativeModel({ model: currentTier.name });
  }

  /**
   * Switch to next available model tier
   */
  switchToNextTier() {
    if (this.currentModelIndex < this.modelTiers.length - 1) {
      this.currentModelIndex++;
      console.log(`Switched to model tier: ${this.modelTiers[this.currentModelIndex].name}`);
      return true;
    }
    return false;
  }

  /**
   * Reset to highest tier model (called periodically or on successful request)
   */
  resetToHighestTier() {
    if (this.currentModelIndex > 0) {
      this.currentModelIndex = 0;
      console.log(`Reset to highest tier model: ${this.modelTiers[0].name}`);
    }
  }

  /**
   * Generate AI response with automatic model tier switching
   */
  async generateResponse(prompt, knowledgeContext = '') {
    const maxRetries = this.modelTiers.length;
    let lastError = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const model = this.getCurrentModel();
        
        // Construct the full prompt with knowledge context
        const fullPrompt = this.constructPrompt(prompt, knowledgeContext);
        
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        // Success - reset to highest tier for next request
        if (this.currentModelIndex > 0) {
          setTimeout(() => this.resetToHighestTier(), this.retryDelay);
        }

        return {
          response: text,
          modelUsed: this.modelTiers[this.currentModelIndex].name,
          tier: this.modelTiers[this.currentModelIndex].tier
        };

      } catch (error) {
        lastError = error;
        console.error(`Error with model ${this.modelTiers[this.currentModelIndex].name}:`, error.message);

        // Check if it's a quota/rate limit error
        if (this.isQuotaError(error)) {
          if (!this.switchToNextTier()) {
            // All models exhausted
            this.lastFailureTime = Date.now();
            throw new Error('All Gemini model tiers have reached their limits. Please try again later.');
          }
          // Continue to next iteration with new model
          continue;
        } else {
          // Non-quota error, don't switch tiers
          throw error;
        }
      }
    }

    throw lastError || new Error('Failed to generate response after all retries');
  }

  /**
   * Check if error is related to quota/rate limits
   */
  isQuotaError(error) {
    const quotaErrorMessages = [
      'quota exceeded',
      'rate limit',
      'too many requests',
      'resource exhausted',
      'RATE_LIMIT_EXCEEDED',
      'QUOTA_EXCEEDED'
    ];
    
    const errorMessage = error.message?.toLowerCase() || '';
    return quotaErrorMessages.some(msg => errorMessage.includes(msg));
  }

  /**
   * Construct the full prompt with system instructions and knowledge context
   */
  constructPrompt(userMessage, knowledgeContext) {
    const systemInstructions = `You are a helpful AI assistant for an architectural company's customer support. 
Your role is to provide accurate, professional, and friendly responses to customer inquiries.

Guidelines:
- Use the provided knowledge base information when relevant
- If you don't have specific information, politely suggest contacting human support
- Keep responses concise but informative
- Maintain a professional yet friendly tone
- Focus on architectural services, pricing, processes, and general company information`;

    let prompt = systemInstructions + '\n\n';
    
    if (knowledgeContext) {
      prompt += `Relevant company information:\n${knowledgeContext}\n\n`;
    }
    
    prompt += `Customer question: ${userMessage}\n\nResponse:`;
    
    return prompt;
  }

  /**
   * Get current model status
   */
  getStatus() {
    return {
      currentModel: this.modelTiers[this.currentModelIndex].name,
      currentTier: this.modelTiers[this.currentModelIndex].tier,
      modelIndex: this.currentModelIndex,
      totalTiers: this.modelTiers.length,
      lastFailureTime: this.lastFailureTime
    };
  }
}

module.exports = GeminiService;