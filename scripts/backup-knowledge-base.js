#!/usr/bin/env node

/**
 * Knowledge Base Backup Script
 * Creates timestamped backups of the knowledge base
 */

const fs = require('fs');
const path = require('path');

class KnowledgeBaseBackup {
    constructor() {
        this.dataDir = path.join(process.cwd(), 'data');
        this.backupDir = path.join(process.cwd(), 'backups');
        this.kbFile = path.join(this.dataDir, 'knowledge-base.json');
    }

    async backup() {
        console.log('💾 Starting knowledge base backup...\n');

        try {
            // Ensure backup directory exists
            if (!fs.existsSync(this.backupDir)) {
                fs.mkdirSync(this.backupDir, { recursive: true });
                console.log('📁 Created backup directory');
            }

            // Check if knowledge base file exists
            if (!fs.existsSync(this.kbFile)) {
                console.error('❌ Knowledge base file not found:', this.kbFile);
                process.exit(1);
            }

            // Read and validate knowledge base
            const kbData = JSON.parse(fs.readFileSync(this.kbFile, 'utf8'));
            
            if (!Array.isArray(kbData)) {
                console.error('❌ Invalid knowledge base format (not an array)');
                process.exit(1);
            }

            // Create backup filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFilename = `knowledge-base-backup-${timestamp}.json`;
            const backupPath = path.join(this.backupDir, backupFilename);

            // Create backup with metadata
            const backupData = {
                metadata: {
                    backupDate: new Date().toISOString(),
                    originalFile: this.kbFile,
                    entryCount: kbData.length,
                    version: '1.0'
                },
                data: kbData
            };

            // Write backup file
            fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

            console.log('✅ Backup created successfully!');
            console.log(`📄 File: ${backupFilename}`);
            console.log(`📊 Entries: ${kbData.length}`);
            console.log(`💾 Size: ${this.formatFileSize(fs.statSync(backupPath).size)}`);

            // Clean up old backups (keep last 10)
            this.cleanupOldBackups();

        } catch (error) {
            console.error('❌ Backup failed:', error.message);
            process.exit(1);
        }
    }

    cleanupOldBackups() {
        try {
            const backupFiles = fs.readdirSync(this.backupDir)
                .filter(file => file.startsWith('knowledge-base-backup-') && file.endsWith('.json'))
                .map(file => ({
                    name: file,
                    path: path.join(this.backupDir, file),
                    mtime: fs.statSync(path.join(this.backupDir, file)).mtime
                }))
                .sort((a, b) => b.mtime - a.mtime);

            if (backupFiles.length > 10) {
                const filesToDelete = backupFiles.slice(10);
                
                console.log(`\n🧹 Cleaning up ${filesToDelete.length} old backup(s)...`);
                
                filesToDelete.forEach(file => {
                    fs.unlinkSync(file.path);
                    console.log(`🗑️  Deleted: ${file.name}`);
                });
            }
        } catch (error) {
            console.warn('⚠️  Warning: Could not clean up old backups:', error.message);
        }
    }

    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    listBackups() {
        console.log('📋 Available backups:\n');

        try {
            if (!fs.existsSync(this.backupDir)) {
                console.log('No backups found (backup directory does not exist)');
                return;
            }

            const backupFiles = fs.readdirSync(this.backupDir)
                .filter(file => file.startsWith('knowledge-base-backup-') && file.endsWith('.json'))
                .map(file => {
                    const filePath = path.join(this.backupDir, file);
                    const stats = fs.statSync(filePath);
                    
                    try {
                        const backupData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                        return {
                            name: file,
                            date: stats.mtime,
                            size: this.formatFileSize(stats.size),
                            entries: backupData.data ? backupData.data.length : 'Unknown'
                        };
                    } catch {
                        return {
                            name: file,
                            date: stats.mtime,
                            size: this.formatFileSize(stats.size),
                            entries: 'Invalid'
                        };
                    }
                })
                .sort((a, b) => b.date - a.date);

            if (backupFiles.length === 0) {
                console.log('No backups found');
                return;
            }

            backupFiles.forEach((backup, index) => {
                console.log(`${index + 1}. ${backup.name}`);
                console.log(`   Date: ${backup.date.toLocaleString()}`);
                console.log(`   Size: ${backup.size}`);
                console.log(`   Entries: ${backup.entries}`);
                console.log('');
            });

        } catch (error) {
            console.error('❌ Error listing backups:', error.message);
        }
    }
}

// Command line interface
const command = process.argv[2];
const backup = new KnowledgeBaseBackup();

switch (command) {
    case 'list':
        backup.listBackups();
        break;
    case 'create':
    case undefined:
        backup.backup();
        break;
    default:
        console.log('Usage: node backup-knowledge-base.js [command]');
        console.log('Commands:');
        console.log('  create (default) - Create a new backup');
        console.log('  list            - List existing backups');
        process.exit(1);
}