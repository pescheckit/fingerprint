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

### Option 6: Plain HTML/CSS/JS

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

## Deploy Everything

From the **root directory**, run:

```bash
npm run build    # Builds all projects
npm run deploy   # Deploys to Cloudflare Pages
```

The build script will:
1. Find your `package.json` (if you have one)
2. Run `npm install` (if needed)
3. Run `npm run build` (if you have a build script)
4. Auto-detect your output directory (dist, build, out, etc.)
5. Copy everything to the deployment bundle

## What Gets Deployed

- **Your URL**: `https://fingerprint.pages.dev/your-name/`
- **Landing page**: `https://fingerprint.pages.dev/` (shows all projects)

## Requirements

Your project just needs:
- A `package.json` with a `build` script (if using a framework)
- OR just static HTML files (no build needed)

The system handles the rest automatically!

## Local Development

Work in your own folder:
```bash
cd your-name/
npm run dev      # or whatever your framework uses
```

## Tips

- **Test locally first** before deploying
- **Add a README** in your folder to explain your approach
- **Commit often** to save your work
- **Have fun!** Try different fingerprinting techniques
