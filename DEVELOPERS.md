# Developer Guide

## Quick Start - Use Any Framework!

You can build with **any framework** you like in your personal folder. The deployment system auto-detects and builds everything.

### Option 1: React (Vite)

```bash
cd your-name/
npm create vite@latest . -- --template react
npm install
npm run dev
```

### Option 2: Nuxt

```bash
cd your-name/
npx nuxi@latest init .
npm install
npm run dev
```

### Option 3: Next.js

```bash
cd your-name/
npx create-next-app@latest . --use-npm
npm run dev
```

### Option 4: Vue (Vite)

```bash
cd your-name/
npm create vite@latest . -- --template vue
npm install
npm run dev
```

### Option 5: Svelte (SvelteKit)

```bash
cd your-name/
npm create svelte@latest .
npm install
npm run dev
```

### Option 6: Astro

```bash
cd your-name/
npm create astro@latest .
npm install
npm run dev
```

### Option 7: Plain HTML/CSS/JS

Just create an `index.html` in your folder - no build needed!

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Fingerprint Test</title>
</head>
<body>
  <h1>Hello from [Your Name]!</h1>
  <script>
    // Your fingerprinting code here
  </script>
</body>
</html>
```

## Development Workflow

### 1. Work in Your Folder

```bash
cd your-name/
npm run dev      # Start your dev server
```

Build and test locally first!

### 2. Commit Your Work

```bash
git add .
git commit -m "Your Name: Brief description of what you built"
```

### 3. Push to Main

```bash
git push origin main
```

### 4. Auto-Deploy! ✨

Cloudflare Pages automatically:
1. Detects your push to `main`
2. Runs `npm run build` (builds ALL developer folders)
3. Deploys everything to production
4. Usually takes 1-2 minutes

## How the Build Works

When you push, the automated build:
1. Finds your `package.json` (if you have one)
2. Runs `npm install` (if needed)
3. Runs `npm run build` (if you have a build script)
4. Auto-detects your output directory (dist, build, out, .output/public, etc.)
5. Combines everyone's work into one deployment

## Your Live URLs

After deployment:
- **Your project**: `https://fingerprint-3y6.pages.dev/your-name/`
- **Landing page**: `https://fingerprint-3y6.pages.dev/` (shows all projects)

## Requirements

Your project just needs:
- **With a framework**: A `package.json` with a `build` script
- **Plain HTML**: Just create `index.html` - no build needed

The automated build system handles the rest!

## Tips

- **Test locally first** - make sure `npm run build` works in your folder
- **Add a README** in your folder to explain your approach
- **Commit often** - every push triggers a new deployment
- **Check build logs** in Cloudflare Pages dashboard if something fails
- **Have fun!** Try different fingerprinting techniques
