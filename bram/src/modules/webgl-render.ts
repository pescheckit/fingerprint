/**
 * WebGL Rendering Test - Creates actual GPU rendering fingerprint
 * Entropy: ~10 bits | Stability: 95% | Hardware-based: Yes
 *
 * Different GPUs render slightly differently due to driver/hardware variations
 */

import { ModuleInterface } from '../types';

export class WebGLRenderModule implements ModuleInterface {
  name = 'webgl-render';
  entropy = 10;
  stability = 95;
  hardwareBased = true;

  isAvailable(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch {
      return false;
    }
  }

  collect(): any {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) return null;

    // Set up shaders for complex rendering
    const vertexShaderSource = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_position * 0.5 + 0.5;
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      varying vec2 v_texCoord;
      void main() {
        float r = sin(v_texCoord.x * 3.14159 * 8.0) * 0.5 + 0.5;
        float g = cos(v_texCoord.y * 3.14159 * 8.0) * 0.5 + 0.5;
        float b = sin((v_texCoord.x + v_texCoord.y) * 3.14159 * 4.0) * 0.5 + 0.5;
        gl_FragColor = vec4(r, g, b, 1.0);
      }
    `;

    // Compile shaders
    const vertexShader = this.compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) return null;

    // Create program
    const program = gl.createProgram();
    if (!program) return null;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      return null;
    }

    // Set up geometry
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    // Render
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Read pixels from multiple locations for better fingerprint
    const pixels = new Uint8Array(4 * 16); // Sample 16 pixels
    const samplePoints = [
      [32, 32], [64, 64], [128, 128], [192, 192],
      [32, 192], [192, 32], [96, 96], [160, 160],
      [48, 128], [128, 48], [200, 100], [100, 200],
      [77, 77], [177, 177], [111, 133], [155, 88]
    ];

    for (let i = 0; i < samplePoints.length; i++) {
      const [x, y] = samplePoints[i];
      gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels.subarray(i * 4, (i + 1) * 4));
    }

    // Calculate hash from pixel data
    const pixelHash = this.hashPixels(pixels);

    // Also get canvas data URL for additional entropy
    const dataUrl = canvas.toDataURL();

    return {
      pixelHash,
      dataUrlHash: this.simpleHash(dataUrl),
      dataUrlLength: dataUrl.length,
      samplePixels: Array.from(pixels).map(v => v.toString(16).padStart(2, '0')).join('')
    };
  }

  private compileShader(gl: any, type: number, source: string): any {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  private hashPixels(pixels: Uint8Array): string {
    let hash = 0;
    for (let i = 0; i < pixels.length; i++) {
      hash = ((hash << 5) - hash) + pixels[i];
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < Math.min(str.length, 1000); i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return hash.toString(36);
  }
}
