#!/usr/bin/env node

/**
 * Health Check Script
 * Monitors the health of the deployed application
 */

import https from 'https';
import http from 'http';

class HealthChecker {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.results = {
            overall: 'unknown',
            timestamp: new Date().toISOString(),
            checks: {}
        };
    }

    async check() {
        console.log(`🏥 Health check for: ${this.baseUrl}\n`);

        await this.checkAPI();
        await this.checkKnowledgeBase();
        await this.checkAIService();
        await this.checkFrontend();

        this.calculateOverallHealth();
        this.printResults();

        return this.results;
    }

    async checkAPI() {
        console.log('🔌 Checking API health...');
        
        try {
            const start = Date.now();
            const result = await this.makeRequest({
                path: '/api/knowledge',
                method: 'GET'
            });
            const responseTime = Date.now() - start;

            this.results.checks.api = {
                status: result.success ? 'healthy' : 'unhealthy',
                responseTime: `${responseTime}ms`,
                error: result.success ? null : result.error
            };

            if (result.success) {
                console.log(`✅ API is healthy (${responseTime}ms)`);
            } else {
                console.log(`❌ API is unhealthy: ${result.error}`);
            }
        } catch (error) {
            this.results.checks.api = {
                status: 'unhealthy',
                error: error.message
            };
            console.log(`❌ API check failed: ${error.message}`);
        }
    }

    async checkKnowledgeBase() {
        console.log('📚 Checking knowledge base...');
        
        try {
            const result = await this.makeRequest({
                path: '/api/knowledge',
                method: 'GET'
            });

            if (result.success) {
                const data = JSON.parse(result.data);
                const entryCount = data.entries ? data.entries.length : 0;
                
                this.results.checks.knowledgeBase = {
                    status: 'healthy',
                    entryCount,
                    lastUpdated: data.entries && data.entries.length > 0 
                        ? data.entries[0].updatedAt 
                        : null
                };

                console.log(`✅ Knowledge base is healthy (${entryCount} entries)`);
            } else {
                this.results.checks.knowledgeBase = {
                    status: 'unhealthy',
                    error: result.error
                };
                console.log(`❌ Knowledge base is unhealthy: ${result.error}`);
            }
        } catch (error) {
            this.results.checks.knowledgeBase = {
                status: 'unhealthy',
                error: error.message
            };
            console.log(`❌ Knowledge base check failed: ${error.message}`);
        }
    }

    async checkAIService() {
        console.log('🤖 Checking AI service...');
        
        try {
            const start = Date.now();
            const result = await this.makeRequest({
                path: '/api/chat',
                method: 'POST',
                body: { message: 'health check' }
            });
            const responseTime = Date.now() - start;

            if (result.success) {
                const data = JSON.parse(result.data);
                
                this.results.checks.aiService = {
                    status: 'healthy',
                    responseTime: `${responseTime}ms`,
                    modelUsed: data.modelUsed,
                    tier: data.tier
                };

                console.log(`✅ AI service is healthy (${data.modelUsed}, ${responseTime}ms)`);
            } else {
                this.results.checks.aiService = {
                    status: result.data && result.data.includes('usage limits') ? 'degraded' : 'unhealthy',
                    error: result.error,
                    responseTime: `${responseTime}ms`
                };

                if (result.data && result.data.includes('usage limits')) {
                    console.log(`⚠️  AI service is degraded: Usage limits reached`);
                } else {
                    console.log(`❌ AI service is unhealthy: ${result.error}`);
                }
            }
        } catch (error) {
            this.results.checks.aiService = {
                status: 'unhealthy',
                error: error.message
            };
            console.log(`❌ AI service check failed: ${error.message}`);
        }
    }

    async checkFrontend() {
        console.log('🌐 Checking frontend...');
        
        try {
            const chatResult = await this.makeRequest({
                path: '/',
                method: 'GET'
            });

            const adminResult = await this.makeRequest({
                path: '/admin.html',
                method: 'GET'
            });

            const chatHealthy = chatResult.success && chatResult.data.includes('chat-interface');
            const adminHealthy = adminResult.success && adminResult.data.includes('knowledge-admin');

            this.results.checks.frontend = {
                status: (chatHealthy && adminHealthy) ? 'healthy' : 'unhealthy',
                chatInterface: chatHealthy ? 'healthy' : 'unhealthy',
                adminInterface: adminHealthy ? 'healthy' : 'unhealthy'
            };

            if (chatHealthy && adminHealthy) {
                console.log('✅ Frontend is healthy (chat + admin)');
            } else {
                console.log(`❌ Frontend issues: chat=${chatHealthy ? 'OK' : 'FAIL'}, admin=${adminHealthy ? 'OK' : 'FAIL'}`);
            }
        } catch (error) {
            this.results.checks.frontend = {
                status: 'unhealthy',
                error: error.message
            };
            console.log(`❌ Frontend check failed: ${error.message}`);
        }
    }

    calculateOverallHealth() {
        const statuses = Object.values(this.results.checks).map(check => check.status);
        
        if (statuses.every(status => status === 'healthy')) {
            this.results.overall = 'healthy';
        } else if (statuses.some(status => status === 'healthy')) {
            this.results.overall = 'degraded';
        } else {
            this.results.overall = 'unhealthy';
        }
    }

    makeRequest(options) {
        return new Promise((resolve) => {
            const url = new URL(options.path, this.baseUrl);
            const isHttps = url.protocol === 'https:';
            const client = isHttps ? https : http;

            const requestOptions = {
                hostname: url.hostname,
                port: url.port || (isHttps ? 443 : 80),
                path: url.pathname + url.search,
                method: options.method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'HealthChecker/1.0'
                },
                timeout: 15000
            };

            const req = client.request(requestOptions, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({ 
                        success: res.statusCode >= 200 && res.statusCode < 400, 
                        data, 
                        statusCode: res.statusCode,
                        error: res.statusCode >= 400 ? `HTTP ${res.statusCode}` : null
                    });
                });
            });

            req.on('error', (error) => {
                resolve({ success: false, error: error.message });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({ success: false, error: 'Request timeout' });
            });

            if (options.body) {
                req.write(JSON.stringify(options.body));
            }

            req.end();
        });
    }

    printResults() {
        console.log('\n📊 Health Check Results:');
        console.log('='.repeat(50));

        const statusEmoji = {
            healthy: '🟢',
            degraded: '🟡',
            unhealthy: '🔴'
        };

        console.log(`Overall Status: ${statusEmoji[this.results.overall]} ${this.results.overall.toUpperCase()}`);
        console.log(`Timestamp: ${this.results.timestamp}\n`);

        Object.entries(this.results.checks).forEach(([component, check]) => {
            console.log(`${statusEmoji[check.status]} ${component}:`);
            Object.entries(check).forEach(([key, value]) => {
                if (key !== 'status' && value !== null) {
                    console.log(`  ${key}: ${value}`);
                }
            });
            console.log('');
        });

        // Exit with appropriate code
        if (this.results.overall === 'unhealthy') {
            process.exit(1);
        } else if (this.results.overall === 'degraded') {
            process.exit(2);
        }
    }
}

// Run health check
const baseUrl = process.argv[2];
if (!baseUrl) {
    console.error('Usage: node health-check.js <base-url>');
    console.error('Example: node health-check.js https://your-app.vercel.app');
    process.exit(1);
}

const checker = new HealthChecker(baseUrl);
checker.check().catch(error => {
    console.error('Health check failed:', error);
    process.exit(1);
});