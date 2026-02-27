/**
 * WebGL/GPU Module - Most reliable for cross-browser device detection
 * Entropy: ~12 bits | Stability: 95% | Hardware-based: Yes
 */

import { ModuleInterface } from '../types';

export class WebGLModule implements ModuleInterface {
  name = 'webgl';
  entropy = 12;
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
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) return null;

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');

    return {
      // Core GPU identification (most reliable)
      vendor: gl.getParameter(gl.VENDOR),
      renderer: gl.getParameter(gl.RENDERER),

      // Unmasked (most valuable for device ID)
      unmaskedVendor: debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
        : null,
      unmaskedRenderer: debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        : null,

      // Version info
      version: gl.getParameter(gl.VERSION),
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),

      // Hardware capabilities (device-specific)
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
      maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
      maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
      maxCombinedTextureImageUnits: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
      maxCubeMapTextureSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
      maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
      maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),

      // Extensions
      extensions: gl.getSupportedExtensions(),

      // Precision
      vertexShaderPrecision: this.getShaderPrecision(gl, gl.VERTEX_SHADER),
      fragmentShaderPrecision: this.getShaderPrecision(gl, gl.FRAGMENT_SHADER)
    };
  }

  private getShaderPrecision(gl: any, shaderType: number): any {
    const precisionTypes = ['LOW_FLOAT', 'MEDIUM_FLOAT', 'HIGH_FLOAT', 'LOW_INT', 'MEDIUM_INT', 'HIGH_INT'];
    const precision: any = {};

    for (const type of precisionTypes) {
      const format = gl.getShaderPrecisionFormat(shaderType, gl[type]);
      precision[type] = {
        precision: format.precision,
        rangeMin: format.rangeMin,
        rangeMax: format.rangeMax
      };
    }

    return precision;
  }
}
