#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DEVELOPERS = ['batuhan', 'bram', 'dennie', 'niels', 'vincent'];
const DIST_DIR = path.join(__dirname, 'dist');

// Clean dist directory
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true });
}
fs.mkdirSync(DIST_DIR);

console.log('🚀 Building all developer projects...\n');

// Build each developer's project
const devLinks = [];

for (const dev of DEVELOPERS) {
  const devDir = path.join(__dirname, dev);
  const packageJsonPath = path.join(devDir, 'package.json');

  console.log(`📦 Processing ${dev}'s project...`);

  // Check if developer has a project
  if (!fs.existsSync(packageJsonPath)) {
    console.log(`   ⏭️  No package.json found, skipping\n`);
    continue;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const hasInstalled = fs.existsSync(path.join(devDir, 'node_modules'));

  try {
    // Install dependencies if needed
    if (!hasInstalled) {
      console.log(`   📥 Installing dependencies...`);
      execSync('npm install', { cwd: devDir, stdio: 'inherit' });
    }

    // Build the project
    if (packageJson.scripts && packageJson.scripts.build) {
      console.log(`   🔨 Building...`);
      execSync('npm run build', { cwd: devDir, stdio: 'inherit' });

      // Detect output directory (common patterns)
      const possibleOutputDirs = ['dist', 'build', '.output/public', 'out', 'public'];
      let outputDir = null;

      for (const dir of possibleOutputDirs) {
        const checkPath = path.join(devDir, dir);
        if (fs.existsSync(checkPath)) {
          outputDir = checkPath;
          break;
        }
      }

      if (outputDir) {
        // Copy to dist
        const targetDir = path.join(DIST_DIR, dev);
        console.log(`   ✅ Copying build output to dist/${dev}`);
        fs.cpSync(outputDir, targetDir, { recursive: true });
        devLinks.push({ name: dev, path: dev });
      } else {
        console.log(`   ⚠️  Build succeeded but no output directory found`);
      }
    } else {
      console.log(`   ℹ️  No build script found, copying static files`);
      const targetDir = path.join(DIST_DIR, dev);
      fs.cpSync(devDir, targetDir, {
        recursive: true,
        filter: (src) => !src.includes('node_modules') && !src.includes('.git')
      });
      devLinks.push({ name: dev, path: dev });
    }
  } catch (error) {
    console.error(`   ❌ Build failed for ${dev}:`, error.message);
  }

  console.log('');
}

// Create landing page
console.log('🏠 Creating landing page...');
const landingPage = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fingerprint Development Session</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .container {
      background: white;
      border-radius: 1rem;
      padding: 3rem;
      max-width: 600px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 {
      color: #333;
      margin-bottom: 0.5rem;
      font-size: 2rem;
    }
    .subtitle {
      color: #666;
      margin-bottom: 2rem;
      font-size: 0.9rem;
    }
    .dev-grid {
      display: grid;
      gap: 1rem;
    }
    .dev-link {
      display: block;
      padding: 1.25rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 0.5rem;
      font-weight: 600;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .dev-link:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0,0,0,0.2);
    }
    .dev-name {
      font-size: 1.2rem;
      text-transform: capitalize;
    }
    .dev-path {
      font-size: 0.85rem;
      opacity: 0.9;
      margin-top: 0.25rem;
    }
    .footer {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #eee;
      color: #666;
      font-size: 0.85rem;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔍 Fingerprint Development</h1>
    <p class="subtitle">Collaborative Session - February 27, 2026</p>

    <div class="dev-grid">
      ${devLinks.map(dev => `
        <a href="/${dev.path}/" class="dev-link">
          <div class="dev-name">${dev.name}</div>
          <div class="dev-path">/${dev.path}/</div>
        </a>
      `).join('')}
    </div>

    ${devLinks.length === 0 ? '<p style="color: #999; text-align: center; padding: 2rem;">No projects deployed yet. Start building!</p>' : ''}

    <div class="footer">
      Built with ❤️ by the PESCheck team
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(DIST_DIR, 'index.html'), landingPage);

console.log('✨ Build complete!\n');
console.log(`📊 Deployed ${devLinks.length} project(s):`);
devLinks.forEach(dev => console.log(`   - ${dev.name}: /${dev.path}/`));
console.log('');
