/**
 * Canvas Fingerprinting Module
 * Entropy: ~5.7 bits
 * Stability: Very High
 * Hardware-based: Yes (GPU differences)
 */
export default class CanvasModule {
  static name = 'canvas';
  static entropy = 5.7;
  static hardware = true;

  static isAvailable() {
    return typeof document !== 'undefined';
  }

  static collect() {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');

    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, 240, 60);
    gradient.addColorStop(0, '#4a90e2');
    gradient.addColorStop(0.5, '#e74c3c');
    gradient.addColorStop(1, '#9013fe');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 240, 60);

    // Draw text with specific font
    ctx.font = '18px "Arial", "Helvetica", sans-serif';
    ctx.fillStyle = '#f39c12';
    ctx.fillText('ThumbmarkJS 🔍', 10, 40);

    // Add shapes for more entropy
    ctx.beginPath();
    ctx.arc(200, 30, 20, 0, 2 * Math.PI);
    ctx.fillStyle = '#2ecc71';
    ctx.fill();

    // Add emoji (different rendering across systems)
    ctx.font = '20px Arial';
    ctx.fillText('🌐🔒', 150, 45);

    // Extract data URL
    const dataUrl = canvas.toDataURL();

    return {
      hash: this.hashString(dataUrl),
      length: dataUrl.length
    };
  }

  static hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }
}
