#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const http = require('http');

const DEVELOPERS = ['batuhan', 'bram', 'dennie', 'niels', 'vincent'];
const PORT = process.env.PORT || 8000;
const DIST_DIR = path.join(__dirname, 'dist');

let buildTimeout = null;
let isBuilding = false;

// Initial build
console.log('🚀 Running initial build...\n');
try {
  execSync('node build.js', { stdio: 'inherit' });
  console.log('\n✨ Initial build complete!\n');
} catch (error) {
  console.error('❌ Initial build failed:', error.message);
  process.exit(1);
}

// Simple file server
const server = http.createServer((req, res) => {
  // Parse URL
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);

  // If directory, try index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // Read and serve file
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <head><title>404 Not Found</title></head>
            <body style="font-family: sans-serif; text-align: center; padding: 3rem;">
              <h1>404 - Not Found</h1>
              <p>Path: ${req.url}</p>
              <a href="/">Back to Home</a>
            </body>
          </html>
        `);
      } else {
        res.writeHead(500);
        res.end('Server error: ' + err.code);
      }
    } else {
      // Determine content type
      const ext = path.extname(filePath);
      const contentTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
      };
      const contentType = contentTypes[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache'
      });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log('🌐 Development server running!');
  console.log(`\n📍 Main page: http://localhost:${PORT}/`);
  console.log('\n👥 Developer pages:');
  DEVELOPERS.forEach(dev => {
    if (fs.existsSync(path.join(DIST_DIR, dev))) {
      console.log(`   - http://localhost:${PORT}/${dev}/`);
    }
  });
  console.log('\n👀 Watching for changes...\n');
});

// Rebuild function with debouncing
function triggerRebuild(changedFile) {
  if (isBuilding) return;

  clearTimeout(buildTimeout);
  buildTimeout = setTimeout(() => {
    console.log(`\n🔄 Change detected: ${changedFile}`);
    console.log('🔨 Rebuilding...\n');

    isBuilding = true;

    try {
      execSync('node build.js', { stdio: 'inherit' });
      console.log('\n✨ Rebuild complete!\n');
    } catch (error) {
      console.error('❌ Rebuild failed:', error.message);
    } finally {
      isBuilding = false;
    }
  }, 300); // 300ms debounce
}

// Watch developer directories
DEVELOPERS.forEach(dev => {
  const devDir = path.join(__dirname, dev);

  if (!fs.existsSync(devDir)) return;

  // Watch the developer directory recursively
  fs.watch(devDir, { recursive: true }, (eventType, filename) => {
    if (!filename) return;

    // Ignore node_modules and common build artifacts
    if (filename.includes('node_modules') ||
        filename.includes('dist') ||
        filename.includes('build') ||
        filename.includes('.output') ||
        filename.startsWith('.')) {
      return;
    }

    const fullPath = path.join(devDir, filename);
    triggerRebuild(path.relative(__dirname, fullPath));
  });

  console.log(`👁️  Watching: ${dev}/`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down development server...');
  server.close();
  process.exit(0);
});
