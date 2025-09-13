#!/usr/bin/env node

/**
 * Knowledge Base Restore Script
 * Restores knowledge base from backup files
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class KnowledgeBaseRestore {
    constructor() {
        this.dataDir = path.join(process.cwd(), 'data');
        this.backupDir = path.join(process.cwd(), 'backups');
        this.kbFile = path.join(this.dataDir, 'knowledge-base.json');
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async restore(backupFile) {
        console.log('🔄 Starting knowledge base restore...\n');

        try {
            // Validate backup file
            const backupPath = path.join(this.backupDir, backupFile);
            
            if (!fs.existsSync(backupPath)) {
                console.error('❌ Backup file not found:', backupFile);
                this.listAvailableBackups();
                process.exit(1);
            }

            // Read and validate backup
            const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
            
            if (!backupData.data || !Array.isArray(backupData.data)) {
                console.error('❌ Invalid backup format');
                process.exit(1);
            }

            // Show backup info
            console.log('📄 Backup Information:');
            if (backupData.metadata) {
                console.log(`   Date: ${new Date(backupData.metadata.backupDate).toLocaleString()}`);
                console.log(`   Entries: ${backupData.metadata.entryCount}`);
                console.log(`   Version: ${backupData.metadata.version || 'Unknown'}`);
            }
            console.log(`   File: ${backupFile}`);
            console.log('');

            // Check if current knowledge base exists
            let currentEntries = 0;
            if (fs.existsSync(this.kbFile)) {
                try {
                    const currentData = JSON.parse(fs.readFileSync(this.kbFile, 'utf8'));
                    currentEntries = Array.isArray(currentData) ? currentData.length : 0;
                } catch {
                    currentEntries = 0;
                }
            }

            // Confirm restore
            if (currentEntries > 0) {
                console.log(`⚠️  Warning: This will replace the current knowledge base (${currentEntries} entries)`);
                const confirmed = await this.askConfirmation('Do you want to continue? (y/N): ');
                
                if (!confirmed) {
                    console.log('❌ Restore cancelled');
                    process.exit(0);
                }

                // Create backup of current data before restore
                await this.backupCurrent();
            }

            // Ensure data directory exists
            if (!fs.existsSync(this.dataDir)) {
                fs.mkdirSync(this.dataDir, { recursive: true });
                console.log('📁 Created data directory');
            }

            // Restore the data
            fs.writeFileSync(this.kbFile, JSON.stringify(backupData.data, null, 2));

            console.log('✅ Knowledge base restored successfully!');
            console.log(`📊 Restored ${backupData.data.length} entries`);
            console.log(`💾 File: ${this.kbFile}`);

        } catch (error) {
            console.error('❌ Restore failed:', error.message);
            process.exit(1);
        } finally {
            this.rl.close();
        }
    }

    async backupCurrent() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFilename = `knowledge-base-pre-restore-${timestamp}.json`;
            const backupPath = path.join(this.backupDir, backupFilename);

            // Ensure backup directory exists
            if (!fs.existsSync(this.backupDir)) {
                fs.mkdirSync(this.backupDir, { recursive: true });
            }

            const currentData = JSON.parse(fs.readFileSync(this.kbFile, 'utf8'));
            const backupData = {
                metadata: {
                    backupDate: new Date().toISOString(),
                    originalFile: this.kbFile,
                    entryCount: currentData.length,
                    version: '1.0',
                    type: 'pre-restore-backup'
                },
                data: currentData
            };

            fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
            console.log(`💾 Current data backed up as: ${backupFilename}`);

        } catch (error) {
            console.warn('⚠️  Warning: Could not backup current data:', error.message);
        }
    }

    listAvailableBackups() {
        console.log('\n📋 Available backups:');

        try {
            if (!fs.existsSync(this.backupDir)) {
                console.log('No backups found (backup directory does not exist)');
                return;
            }

            const backupFiles = fs.readdirSync(this.backupDir)
                .filter(file => file.startsWith('knowledge-base-backup-') && file.endsWith('.json'))
                .sort()
                .reverse();

            if (backupFiles.length === 0) {
                console.log('No backups found');
                return;
            }

            backupFiles.forEach((file, index) => {
                console.log(`  ${index + 1}. ${file}`);
            });

            console.log('\nUsage: node restore-knowledge-base.js <backup-filename>');

        } catch (error) {
            console.error('❌ Error listing backups:', error.message);
        }
    }

    askConfirmation(question) {
        return new Promise((resolve) => {
            this.rl.question(question, (answer) => {
                resolve(answer.toLowerCase().trim() === 'y' || answer.toLowerCase().trim() === 'yes');
            });
        });
    }
}

// Command line interface
const backupFile = process.argv[2];
const restore = new KnowledgeBaseRestore();

if (!backupFile) {
    console.log('Usage: node restore-knowledge-base.js <backup-filename>');
    restore.listAvailableBackups();
    process.exit(1);
} else {
    restore.restore(backupFile);
}