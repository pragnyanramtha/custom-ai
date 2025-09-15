import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

class KnowledgeBase {
  constructor() {
    this.filePath = path.join(process.cwd(), 'data', 'knowledge-base.json');
    this.ensureDataDirectory();
  }

  /**
   * Ensure the data directory exists
   */
  async ensureDataDirectory() {
    const dataDir = path.dirname(this.filePath);
    try {
      await fs.access(dataDir);
    } catch (error) {
      await fs.mkdir(dataDir, { recursive: true });
    }
  }

  /**
   * Load knowledge base from JSON file
   */
  async loadKnowledgeBase() {
    const maxRetries = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.ensureDataDirectory();
        const data = await fs.readFile(this.filePath, 'utf8');
        
        // Validate JSON format
        const parsed = JSON.parse(data);
        
        // Handle legacy format (array) vs new format (object with entries)
        if (Array.isArray(parsed)) {
          const knowledgeBase = {
            entries: parsed,
            lastUpdated: new Date().toISOString(),
            version: '1.0'
          };
          // Migrate to new format
          await this.saveKnowledgeBase(knowledgeBase);
          return knowledgeBase;
        }
        
        // Validate structure
        if (!parsed.entries || !Array.isArray(parsed.entries)) {
          throw new Error('Invalid knowledge base format: entries must be an array');
        }
        
        return parsed;
        
      } catch (error) {
        lastError = error;
        
        if (error.code === 'ENOENT') {
          // File doesn't exist, create empty knowledge base
          const emptyKB = { 
            entries: [], 
            lastUpdated: new Date().toISOString(),
            version: '1.0'
          };
          await this.saveKnowledgeBase(emptyKB);
          return emptyKB;
        }
        
        if (error instanceof SyntaxError) {
          console.error(`JSON parse error (attempt ${attempt}):`, error.message);
          
          if (attempt < maxRetries) {
            // Try to recover by creating backup and resetting
            await this.createCorruptionBackup();
            const emptyKB = { 
              entries: [], 
              lastUpdated: new Date().toISOString(),
              version: '1.0',
              recovered: true
            };
            await this.saveKnowledgeBase(emptyKB);
            return emptyKB;
          }
        }
        
        if (attempt < maxRetries) {
          console.warn(`Knowledge base load attempt ${attempt} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 100 * attempt));
          continue;
        }
      }
    }
    
    throw new Error(`Failed to load knowledge base after ${maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Save knowledge base to JSON file
   */
  async saveKnowledgeBase(knowledgeBase) {
    const maxRetries = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.ensureDataDirectory();
        
        // Validate data before saving
        if (!knowledgeBase.entries || !Array.isArray(knowledgeBase.entries)) {
          throw new Error('Invalid knowledge base format: entries must be an array');
        }
        
        // Update metadata
        knowledgeBase.lastUpdated = new Date().toISOString();
        knowledgeBase.version = knowledgeBase.version || '1.0';
        
        // Create backup before saving (for safety)
        if (attempt === 1) {
          await this.createSafetyBackup();
        }
        
        // Write to temporary file first, then rename (atomic operation)
        const tempPath = `${this.filePath}.tmp`;
        const jsonData = JSON.stringify(knowledgeBase, null, 2);
        
        await fs.writeFile(tempPath, jsonData, 'utf8');
        await fs.rename(tempPath, this.filePath);
        
        return; // Success
        
      } catch (error) {
        lastError = error;
        console.error(`Knowledge base save attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 100 * attempt));
          continue;
        }
      }
    }
    
    throw new Error(`Failed to save knowledge base after ${maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Create a backup of corrupted data for recovery
   */
  async createCorruptionBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(path.dirname(this.filePath), `corrupted-backup-${timestamp}.json`);
      
      const corruptedData = await fs.readFile(this.filePath, 'utf8');
      await fs.writeFile(backupPath, corruptedData, 'utf8');
      
      console.log(`Corrupted data backed up to: ${backupPath}`);
    } catch (error) {
      console.warn('Could not create corruption backup:', error.message);
    }
  }

  /**
   * Create a safety backup before major operations
   */
  async createSafetyBackup() {
    try {
      const backupDir = path.join(process.cwd(), 'backups');
      await fs.mkdir(backupDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(backupDir, `safety-backup-${timestamp}.json`);
      
      const currentData = await fs.readFile(this.filePath, 'utf8');
      await fs.writeFile(backupPath, currentData, 'utf8');
      
      // Clean up old safety backups (keep last 5)
      const backupFiles = await fs.readdir(backupDir);
      const safetyBackups = backupFiles
        .filter(file => file.startsWith('safety-backup-'))
        .sort()
        .reverse();
      
      if (safetyBackups.length > 5) {
        const filesToDelete = safetyBackups.slice(5);
        for (const file of filesToDelete) {
          await fs.unlink(path.join(backupDir, file));
        }
      }
      
    } catch (error) {
      // Don't fail the main operation if backup fails
      console.warn('Could not create safety backup:', error.message);
    }
  }

  /**
   * Get all knowledge entries
   */
  async getAllEntries() {
    const kb = await this.loadKnowledgeBase();
    return kb.entries || [];
  }

  /**
   * Get a specific entry by ID
   */
  async getEntryById(id) {
    const entries = await this.getAllEntries();
    return entries.find(entry => entry.id === id);
  }

  /**
   * Create a new knowledge entry
   */
  async createEntry(key, value, tags = []) {
    const kb = await this.loadKnowledgeBase();
    
    const newEntry = {
      id: this.generateId(),
      key: key.trim(),
      value: value.trim(),
      tags: Array.isArray(tags) ? tags : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    kb.entries = kb.entries || [];
    kb.entries.push(newEntry);
    
    await this.saveKnowledgeBase(kb);
    return newEntry;
  }

  /**
   * Update an existing knowledge entry
   */
  async updateEntry(id, updates) {
    const kb = await this.loadKnowledgeBase();
    const entryIndex = kb.entries.findIndex(entry => entry.id === id);
    
    if (entryIndex === -1) {
      throw new Error(`Entry with ID ${id} not found`);
    }

    const existingEntry = kb.entries[entryIndex];
    const updatedEntry = {
      ...existingEntry,
      ...updates,
      id: existingEntry.id, // Ensure ID cannot be changed
      updatedAt: new Date().toISOString()
    };

    kb.entries[entryIndex] = updatedEntry;
    await this.saveKnowledgeBase(kb);
    return updatedEntry;
  }

  /**
   * Delete a knowledge entry
   */
  async deleteEntry(id) {
    const kb = await this.loadKnowledgeBase();
    const entryIndex = kb.entries.findIndex(entry => entry.id === id);
    
    if (entryIndex === -1) {
      throw new Error(`Entry with ID ${id} not found`);
    }

    const deletedEntry = kb.entries.splice(entryIndex, 1)[0];
    await this.saveKnowledgeBase(kb);
    return deletedEntry;
  }

  /**
   * Search knowledge entries with fuzzy matching
   */
  async searchEntries(query, limit = 10) {
    const entries = await this.getAllEntries();
    
    if (!query || query.trim() === '') {
      return entries.slice(0, limit);
    }

    const searchTerm = query.toLowerCase().trim();
    const results = [];

    for (const entry of entries) {
      const score = this.calculateRelevanceScore(entry, searchTerm);
      if (score > 0) {
        results.push({ ...entry, relevanceScore: score });
      }
    }

    // Sort by relevance score (highest first) and limit results
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  /**
   * Calculate relevance score for search
   */
  calculateRelevanceScore(entry, searchTerm) {
    let score = 0;
    const key = entry.key.toLowerCase();
    const value = entry.value.toLowerCase();
    const tags = entry.tags.map(tag => tag.toLowerCase());

    // Exact key match gets highest score
    if (key === searchTerm) {
      score += 100;
    }
    // Key contains search term
    else if (key.includes(searchTerm)) {
      score += 50;
    }

    // Tag exact match
    if (tags.includes(searchTerm)) {
      score += 40;
    }

    // Value contains search term
    if (value.includes(searchTerm)) {
      score += 20;
    }

    // Partial word matches in key
    const keyWords = key.split(/\s+/);
    const searchWords = searchTerm.split(/\s+/);
    
    for (const searchWord of searchWords) {
      for (const keyWord of keyWords) {
        if (keyWord.includes(searchWord) || searchWord.includes(keyWord)) {
          score += 10;
        }
      }
    }

    return score;
  }

  /**
   * Get relevant context for AI based on user message
   */
  async getRelevantContext(userMessage, maxEntries = 3) {
    const searchResults = await this.searchEntries(userMessage, maxEntries);
    
    if (searchResults.length === 0) {
      return '';
    }

    const contextParts = searchResults.map(entry => 
      `${entry.key}: ${entry.value}`
    );

    return contextParts.join('\n\n');
  }

  /**
   * Generate a unique ID for entries
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Get knowledge base statistics
   */
  async getStats() {
    const entries = await this.getAllEntries();
    const kb = await this.loadKnowledgeBase();
    
    return {
      totalEntries: entries.length,
      lastUpdated: kb.lastUpdated,
      averageKeyLength: entries.length > 0 ? 
        entries.reduce((sum, entry) => sum + entry.key.length, 0) / entries.length : 0,
      averageValueLength: entries.length > 0 ? 
        entries.reduce((sum, entry) => sum + entry.value.length, 0) / entries.length : 0
    };
  }
}

export default KnowledgeBase;