/**
 * OffscreenCanvas Module
 *
 * SCHOOL RESEARCH PROJECT - Educational Purposes
 * Demonstrates modern GPU fingerprinting using OffscreenCanvas API.
 * Research use: Understanding hardware-based fingerprinting in Web Workers
 *
 * Entropy: ~8 bits | Stability: 88% | Hardware-based: Yes
 *
 * Technique:
 * - OffscreenCanvas allows canvas rendering in Web Workers (off main thread)
 * - GPU rendering differences persist even in worker context
 * - Combines WebGL and 2D rendering for maximum entropy
 * - Modern API introduced in Chrome 69+, Firefox 105+
 *
 * Educational Value:
 * - Shows that moving rendering to workers doesn't prevent fingerprinting
 * - Demonstrates that GPU characteristics leak through all rendering contexts
 * - Highlights privacy implications of modern browser APIs
 */

import { ModuleInterface } from '../../types';

export class OffscreenCanvasModule implements ModuleInterface {
  name = 'offscreen-canvas';
  entropy = 8;
  stability = 88;
  hardwareBased = true;

  isAvailable(): boolean {
    // Check if OffscreenCanvas is supported
    return typeof OffscreenCanvas !== 'undefined' &&
           typeof window !== 'undefined';
  }

  async collect(): Promise<any> {
    try {
      // Attempt to use OffscreenCanvas API
      const canvasResult = await this.renderOffscreenCanvas();

      if (!canvasResult) {
        // Fallback to inline rendering if OffscreenCanvas not fully supported
        return this.fallbackRender();
      }

      return {
        ...canvasResult,
        apiSupported: true,

        // Educational: Explain what this means
        research: {
          technique: 'GPU fingerprinting via OffscreenCanvas in worker context',
          privacy: 'Even worker-based rendering exposes GPU characteristics',
          browsers: 'Supported in Chrome 69+, Firefox 105+, Safari 16.4+',
          entropy: 'GPU differences provide ~8 bits of identifying information'
        }
      };

    } catch (error) {
      // If OffscreenCanvas fails, use fallback
      return this.fallbackRender();
    }
  }

  /**
   * Primary method: Render using OffscreenCanvas
   * This can be done in a Worker for true off-main-thread rendering
   */
  private async renderOffscreenCanvas(): Promise<any | null> {
    try {
      // Create OffscreenCanvas
      const offscreen = new OffscreenCanvas(300, 150);

      // Method 1: 2D Context rendering
      const ctx2d = offscreen.getContext('2d');
      let hash2d = null;

      if (ctx2d) {
        // Draw complex scene to extract GPU rendering differences
        this.draw2DScene(ctx2d as OffscreenCanvasRenderingContext2D);

        // Extract image data and hash
        const imageData = ctx2d.getImageData(0, 0, 300, 150);
        hash2d = this.hashImageData(imageData);
      }

      // Method 2: WebGL Context rendering
      const glCtx = offscreen.getContext('webgl') || offscreen.getContext('webgl2');
      let hashWebGL = null;

      if (glCtx) {
        // Render WebGL scene
        this.drawWebGLScene(glCtx as WebGLRenderingContext);

        // Read pixels
        const pixels = new Uint8Array(300 * 150 * 4);
        glCtx.readPixels(0, 0, 300, 150, glCtx.RGBA, glCtx.UNSIGNED_BYTE, pixels);
        hashWebGL = this.hashPixels(pixels);
      }

      // Convert to blob for additional signature
      let blobHash = null;
      if (ctx2d) {
        try {
          const blob = await offscreen.convertToBlob({ type: 'image/png' });
          blobHash = await this.hashBlob(blob);
        } catch (e) {
          // convertToBlob might not be supported
        }
      }

      return {
        hash2d,
        hashWebGL,
        blobHash,
        combinedHash: this.combineHashes(hash2d, hashWebGL, blobHash),
        width: 300,
        height: 150,
        contexts: {
          '2d': hash2d !== null,
          'webgl': hashWebGL !== null
        }
      };

    } catch (error) {
      return null;
    }
  }

  /**
   * Draw complex 2D scene to maximize GPU rendering differences
   */
  private draw2DScene(ctx: OffscreenCanvasRenderingContext2D): void {
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 300, 150);
    gradient.addColorStop(0, '#FF6B6B');
    gradient.addColorStop(0.5, '#4ECDC4');
    gradient.addColorStop(1, '#45B7D1');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 300, 150);

    // Text rendering (font rendering differences)
    ctx.font = '20px Arial, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('OffscreenCanvas', 10, 30);
    ctx.fillText('GPU Fingerprint', 10, 55);

    // Geometric shapes with anti-aliasing
    ctx.beginPath();
    ctx.arc(150, 75, 40, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Bezier curves (GPU-dependent rendering)
    ctx.beginPath();
    ctx.moveTo(50, 100);
    ctx.bezierCurveTo(100, 50, 200, 50, 250, 100);
    ctx.strokeStyle = '#9B59B6';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Radial gradient
    const radialGradient = ctx.createRadialGradient(250, 120, 5, 250, 120, 30);
    radialGradient.addColorStop(0, '#E74C3C');
    radialGradient.addColorStop(1, '#3498DB');
    ctx.fillStyle = radialGradient;
    ctx.fillRect(220, 90, 60, 60);

    // Shadow rendering (GPU-dependent)
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = '#2ECC71';
    ctx.fillRect(20, 110, 40, 30);
  }

  /**
   * Draw WebGL scene to extract GPU-specific rendering
   */
  private drawWebGLScene(gl: WebGLRenderingContext): void {
    // Clear with specific color
    gl.clearColor(0.2, 0.3, 0.4, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Simple vertex shader
    const vsSource = `
      attribute vec4 aVertexPosition;
      void main() {
        gl_Position = aVertexPosition;
      }
    `;

    // Simple fragment shader with GPU-dependent precision
    const fsSource = `
      precision mediump float;
      void main() {
        // GPU-dependent color calculation
        float r = gl_FragCoord.x / 300.0;
        float g = gl_FragCoord.y / 150.0;
        float b = (gl_FragCoord.x + gl_FragCoord.y) / 450.0;
        gl_FragColor = vec4(r, g, b, 1.0);
      }
    `;

    try {
      // Create shaders
      const vertexShader = this.compileShader(gl, vsSource, gl.VERTEX_SHADER);
      const fragmentShader = this.compileShader(gl, fsSource, gl.FRAGMENT_SHADER);

      if (!vertexShader || !fragmentShader) return;

      // Create program
      const program = gl.createProgram();
      if (!program) return;

      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        return;
      }

      gl.useProgram(program);

      // Create triangle
      const vertices = new Float32Array([
        -0.5, -0.5,
         0.5, -0.5,
         0.0,  0.5
      ]);

      const vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

      const position = gl.getAttribLocation(program, 'aVertexPosition');
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(position);

      // Draw
      gl.drawArrays(gl.TRIANGLES, 0, 3);

    } catch (e) {
      // Ignore shader errors
    }
  }

  /**
   * Compile WebGL shader
   */
  private compileShader(gl: WebGLRenderingContext, source: string, type: number): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  /**
   * Fallback rendering using standard Canvas
   * Used when OffscreenCanvas is not available
   */
  private fallbackRender(): any {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');

      if (!ctx) return { apiSupported: false, fallback: true, error: 'No 2D context' };

      // Use standard OffscreenCanvasRenderingContext2D methods on CanvasRenderingContext2D
      // They share the same interface
      this.draw2DScene(ctx as any);

      const imageData = ctx.getImageData(0, 0, 300, 150);
      const hash = this.hashImageData(imageData);

      return {
        apiSupported: false,
        fallback: true,
        hash2d: hash,
        hashWebGL: null,
        blobHash: null,
        combinedHash: hash,
        width: 300,
        height: 150
      };

    } catch (error) {
      return {
        apiSupported: false,
        fallback: true,
        error: String(error)
      };
    }
  }

  /**
   * Hash ImageData object
   */
  private hashImageData(imageData: ImageData): string {
    // Sample pixels from multiple regions for efficiency
    const data = imageData.data;
    const samples: number[] = [];

    // Sample every 100th pixel
    for (let i = 0; i < data.length; i += 400) {
      samples.push(data[i], data[i + 1], data[i + 2], data[i + 3]);
    }

    return this.hashArray(samples);
  }

  /**
   * Hash pixel array
   */
  private hashPixels(pixels: Uint8Array): string {
    // Sample pixels for efficiency
    const samples: number[] = [];
    for (let i = 0; i < pixels.length; i += 400) {
      samples.push(pixels[i]);
    }
    return this.hashArray(samples);
  }

  /**
   * Hash blob asynchronously
   */
  private async hashBlob(blob: Blob): Promise<string> {
    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Sample first 1000 bytes
    const samples = Array.from(bytes.slice(0, 1000));
    return this.hashArray(samples);
  }

  /**
   * Combine multiple hashes
   */
  private combineHashes(...hashes: (string | null)[]): string {
    const validHashes = hashes.filter(h => h !== null).join('|');
    return this.hashString(validHashes);
  }

  /**
   * Hash an array of numbers
   */
  private hashArray(arr: number[]): string {
    let hash = 0;
    for (let i = 0; i < arr.length; i++) {
      hash = ((hash << 5) - hash) + arr[i];
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Hash a string
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}
