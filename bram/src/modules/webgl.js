/**
 * WebGL Fingerprinting Module
 * Entropy: ~7 bits
 * Stability: Very High
 * Hardware-based: Yes (GPU identification)
 */
export default class WebGLModule {
  static name = 'webgl';
  static entropy = 7.0;
  static hardware = true;

  static isAvailable() {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  }

  static collect() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) return null;

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');

    const data = {
      vendor: gl.getParameter(gl.VENDOR),
      renderer: gl.getParameter(gl.RENDERER),
      version: gl.getParameter(gl.VERSION),
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      extensions: gl.getSupportedExtensions(),

      // Hardware-specific parameters
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
      maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
      maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
      maxVertexTextureImageUnits: gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
      maxCombinedTextureImageUnits: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
      maxCubeMapTextureSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
      maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
      maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
      maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
      aliasedLineWidthRange: gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE),
      aliasedPointSizeRange: gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)
    };

    // Unmasked vendor and renderer (most valuable for identification)
    if (debugInfo) {
      data.unmaskedVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      data.unmaskedRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    }

    return data;
  }
}
