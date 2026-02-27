#!/bin/bash
# Cleanup script to remove old module files after reorganization

cd "$(dirname "$0")/src/modules"

echo "Removing old module files from root modules directory..."

rm -f audio.ts
rm -f canvas-properties.ts
rm -f canvas.ts
rm -f color-depth.ts
rm -f floating-point.ts
rm -f hardware.ts
rm -f performance-ratios.ts
rm -f performance.ts
rm -f screen-aspect.ts
rm -f screen.ts
rm -f system.ts
rm -f tor-detection-server.ts
rm -f tor-detection.ts
rm -f touch-capabilities.ts
rm -f webgl-capabilities.ts
rm -f webgl-render.ts
rm -f webgl.ts

echo "✓ Cleanup complete!"
echo ""
echo "New structure:"
tree -L 2 .
