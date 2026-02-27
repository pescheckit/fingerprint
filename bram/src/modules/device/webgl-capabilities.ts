/**
 * WebGL Capabilities Module (Tor-Resistant)
 * Uses actual hardware capabilities, not spoofable strings
 * Entropy: ~4 bits | Stability: 90% | Hardware-based: Yes
 *
 * Tor can spoof renderer strings but NOT hardware limits!
 */

import { ModuleInterface } from '../../types';

export class WebGLCapabilitiesModule implements ModuleInterface {
  name = 'webgl-capabilities';
  entropy = 4;
  stability = 90;
  hardwareBased = true;

  isAvailable(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch {
      return false;
    }
  }

  collect(): any {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) return null;

    // Use ACTUAL hardware capability limits (Tor cannot spoof these!)
    return {
      // Texture capabilities (GPU hardware)
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxCubeMapSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
      maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),

      // Viewport limits (hardware)
      maxViewportDims: {
        width: gl.getParameter(gl.MAX_VIEWPORT_DIMS)[0],
        height: gl.getParameter(gl.MAX_VIEWPORT_DIMS)[1]
      },

      // Fragment/Vertex limits (GPU architecture)
      maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
      maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
      maxCombinedTextureImageUnits: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
      maxVertexTextureImageUnits: gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
      maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
      maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
      maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),

      // Shader precision (hardware FPU capabilities - NOT spoofable!)
      vertexPrecisionHigh: this.getPrecision(gl, gl.VERTEX_SHADER, gl.HIGH_FLOAT),
      fragmentPrecisionHigh: this.getPrecision(gl, gl.FRAGMENT_SHADER, gl.HIGH_FLOAT),

      // Extension support (driver capabilities)
      extensionCount: (gl.getSupportedExtensions() || []).length,
      hasDepthTexture: !!gl.getExtension('WEBGL_depth_texture'),
      hasDrawBuffers: !!gl.getExtension('WEBGL_draw_buffers'),
      hasInstancedArrays: !!gl.getExtension('ANGLE_instanced_arrays'),

      // Line width range (GPU-specific)
      aliasedLineWidthRange: {
        min: gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE)[0],
        max: gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE)[1]
      },

      // Point size range (GPU-specific)
      aliasedPointSizeRange: {
        min: gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)[0],
        max: gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)[1]
      },

      // Generate signature from capabilities only
      signature: this.generateSignature(gl)
    };
  }

  private getPrecision(gl: any, shaderType: number, precisionType: number): any {
    const format = gl.getShaderPrecisionFormat(shaderType, precisionType);
    return {
      precision: format.precision,
      rangeMin: format.rangeMin,
      rangeMax: format.rangeMax
    };
  }

  private generateSignature(gl: any): string {
    // Create signature from hardware capabilities only
    const caps = [
      gl.getParameter(gl.MAX_TEXTURE_SIZE),
      gl.getParameter(gl.MAX_VIEWPORT_DIMS)[0],
      gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      (gl.getSupportedExtensions() || []).length
    ];

    let hash = 0;
    for (const cap of caps) {
      hash = ((hash << 5) - hash) + cap;
      hash = hash & hash;
    }

    return hash.toString(36);
  }
}
