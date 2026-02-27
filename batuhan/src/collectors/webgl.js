export function getWebGLFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return { supported: false };

    const result = {
      supported: true,
      vendor: gl.getParameter(gl.VENDOR),
      renderer: gl.getParameter(gl.RENDERER),
      version: gl.getParameter(gl.VERSION),
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      unmaskedVendor: null,
      unmaskedRenderer: null,
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxViewportDims: Array.from(gl.getParameter(gl.MAX_VIEWPORT_DIMS)),
      maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
      maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
      maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
      maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
      maxCombinedTextureImageUnits: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
      maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
      maxCubeMapTextureSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
      maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      redBits: gl.getParameter(gl.RED_BITS),
      greenBits: gl.getParameter(gl.GREEN_BITS),
      blueBits: gl.getParameter(gl.BLUE_BITS),
      alphaBits: gl.getParameter(gl.ALPHA_BITS),
      depthBits: gl.getParameter(gl.DEPTH_BITS),
      stencilBits: gl.getParameter(gl.STENCIL_BITS),
      aliasedLineWidthRange: Array.from(gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE)),
      aliasedPointSizeRange: Array.from(gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)),
      extensions: gl.getSupportedExtensions(),
    };

    const debugExt = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugExt) {
      result.unmaskedVendor = gl.getParameter(debugExt.UNMASKED_VENDOR_WEBGL);
      result.unmaskedRenderer = gl.getParameter(debugExt.UNMASKED_RENDERER_WEBGL);
    }

    // WebGL2 extras
    const gl2 = canvas.getContext('webgl2');
    if (gl2) {
      result.webgl2 = true;
      result.maxSamples = gl2.getParameter(gl2.MAX_SAMPLES);
      result.max3dTextureSize = gl2.getParameter(gl2.MAX_3D_TEXTURE_SIZE);
      result.maxArrayTextureLayers = gl2.getParameter(gl2.MAX_ARRAY_TEXTURE_LAYERS);
      result.maxColorAttachments = gl2.getParameter(gl2.MAX_COLOR_ATTACHMENTS);
    } else {
      result.webgl2 = false;
    }

    return result;
  } catch (e) {
    return { supported: false, error: e.message };
  }
}
