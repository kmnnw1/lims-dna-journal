import fs from 'fs';
import path from 'path';

// Directories to watch
const WATCH_DIRS = ['app', 'components', 'lib', 'hooks', 'types', 'scripts', 'tests', '.'];

console.log('🔄 File Backup Daemon started. Monitoring for changes...');

function watchDir(dir) {
    if (!fs.existsSync(dir)) return;

    fs.watch(dir, { recursive: true }, (eventType, filename) => {
        if (!filename) return;

        // Ignore backups, next cache, node_modules, and git files
        if (filename.endsWith('~') || 
            filename.includes('node_modules') || 
            filename.includes('.next') || 
            filename.includes('.git') ||
            filename.includes('llm-context') ||
            filename.endsWith('.tmp')) return;

        const fullPath = path.join(dir, filename);
        if (!fs.existsSync(fullPath)) return;
        
        try {
            const stat = fs.statSync(fullPath);
            if (stat.isFile()) {
                const backupPath = `${fullPath}~`;
                fs.copyFileSync(fullPath, backupPath);
                // console.log(`💾 Auto-saved backup: ${filename}~`);
            }
        } catch (err) {
            // Ignore file lock errors during rapid saves
        }
    });
}

WATCH_DIRS.forEach(d => watchDir(path.join(process.cwd(), d)));

// Keep process alive indefinitely
setInterval(() => {}, 1000 * 60 * 60);
