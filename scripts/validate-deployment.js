#!/usr/bin/env node

/**
 * Deployment Validation Script
 * Validates that all required components are working correctly
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

class DeploymentValidator {
    constructor(baseUrl = 'http://localhost:3000') {
        this.baseUrl = baseUrl;
        this.errors = [];
        this.warnings = [];
    }

    async validate() {
        console.log('🔍 Starting deployment validation...\n');

        await this.validateEnvironment();
        await this.validateFiles();
        await this.validateAPI();
        await this.validateFrontend();

        this.printResults();
        
        if (this.errors.length > 0) {
            process.exit(1);
        }
    }

    async validateEnvironment() {
        console.log('📋 Validating environment configuration...');

        // Check for required environment variables
        const requiredEnvVars = ['GEMINI_API_KEY'];
        
        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                this.errors.push(`Missing required environment variable: ${envVar}`);
            } else {
                console.log(`✅ ${envVar} is set`);
            }
        }

        // Validate Gemini API key format
        if (process.env.GEMINI_API_KEY) {
            if (!process.env.GEMINI_API_KEY.startsWith('AIza')) {
                this.warnings.push('GEMINI_API_KEY format may be incorrect (should start with "AIza")');
            }
        }

        console.log('');
    }

    async validateFiles() {
        console.log('📁 Validating required files...');

        const requiredFiles = [
            'package.json',
            'vercel.json',
            'index.html',
            'admin.html',
            'api/chat.js',
            'api/knowledge/index.js',
            'api/knowledge/[id].js',
            'api/knowledge/search.js',
            'lib/geminiService.js',
            'lib/knowledgeBase.js',
            'lib/utils.js',
            'js/chat.js',
            'js/admin.js',
            'styles/chat.css',
            'styles/admin.css',
            'data/knowledge-base.json'
        ];

        for (const file of requiredFiles) {
            if (fs.existsSync(file)) {
                console.log(`✅ ${file} exists`);
            } else {
                this.errors.push(`Missing required file: ${file}`);
            }
        }

        // Validate knowledge base JSON
        try {
            const kbPath = 'data/knowledge-base.json';
            if (fs.existsSync(kbPath)) {
                const kbData = JSON.parse(fs.readFileSync(kbPath, 'utf8'));
                if (!Array.isArray(kbData)) {
                    this.errors.push('knowledge-base.json should contain an array');
                } else {
                    console.log(`✅ Knowledge base contains ${kbData.length} entries`);
                }
            }
        } catch (error) {
            this.errors.push(`Invalid JSON in knowledge-base.json: ${error.message}`);
        }

        console.log('');
    }

    async validateAPI() {
        console.log('🔌 Validating API endpoints...');

        const endpoints = [
            { path: '/api/chat', method: 'POST', body: { message: 'test' } },
            { path: '/api/knowledge', method: 'GET' },
            { path: '/api/knowledge/search?q=test', method: 'GET' }
        ];

        for (const endpoint of endpoints) {
            try {
                const result = await this.makeRequest(endpoint);
                if (result.success) {
                    console.log(`✅ ${endpoint.method} ${endpoint.path} - OK`);
                } else {
                    this.errors.push(`${endpoint.method} ${endpoint.path} failed: ${result.error}`);
                }
            } catch (error) {
                this.errors.push(`${endpoint.method} ${endpoint.path} error: ${error.message}`);
            }
        }

        console.log('');
    }

    async validateFrontend() {
        console.log('🌐 Validating frontend pages...');

        const pages = [
            { path: '/', name: 'Chat Interface' },
            { path: '/admin.html', name: 'Admin Interface' }
        ];

        for (const page of pages) {
            try {
                const result = await this.makeRequest({ path: page.path, method: 'GET' });
                if (result.success) {
                    console.log(`✅ ${page.name} - OK`);
                } else {
                    this.errors.push(`${page.name} failed to load: ${result.error}`);
                }
            } catch (error) {
                this.errors.push(`${page.name} error: ${error.message}`);
            }
        }

        console.log('');
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
                    'User-Agent': 'DeploymentValidator/1.0'
                },
                timeout: 10000
            };

            const req = client.request(requestOptions, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 400) {
                        resolve({ success: true, data, statusCode: res.statusCode });
                    } else {
                        resolve({ success: false, error: `HTTP ${res.statusCode}`, data });
                    }
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
        console.log('📊 Validation Results:');
        console.log('='.repeat(50));

        if (this.errors.length === 0 && this.warnings.length === 0) {
            console.log('🎉 All validations passed! Deployment is ready.');
        } else {
            if (this.errors.length > 0) {
                console.log('\n❌ Errors:');
                this.errors.forEach(error => console.log(`  • ${error}`));
            }

            if (this.warnings.length > 0) {
                console.log('\n⚠️  Warnings:');
                this.warnings.forEach(warning => console.log(`  • ${warning}`));
            }
        }

        console.log('');
    }
}

// Run validation
const baseUrl = process.argv[2] || 'http://localhost:3000';
const validator = new DeploymentValidator(baseUrl);
validator.validate().catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
});