import { Collector } from '../collector.js';

export class WebGLCollector extends Collector {
  constructor() {
    super('webgl', 'WebGL renderer and capabilities', [
      'maxTextureSize', 'maxRenderbufferSize',
    ]);
  }

  async collect() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    if (!gl) {
      return { supported: false };
    }

    const debugExt = gl.getExtension('WEBGL_debug_renderer_info');

    const vendor = debugExt
      ? gl.getParameter(debugExt.UNMASKED_VENDOR_WEBGL)
      : null;
    const renderer = debugExt
      ? gl.getParameter(debugExt.UNMASKED_RENDERER_WEBGL)
      : null;

    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const maxViewportDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
    const maxRenderbufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);

    const extensions = gl.getSupportedExtensions() || [];

    const vertexShaderPrecision = this._getShaderPrecision(gl, gl.VERTEX_SHADER);
    const fragmentShaderPrecision = this._getShaderPrecision(gl, gl.FRAGMENT_SHADER);

    return {
      supported: true,
      vendor,
      renderer,
      maxTextureSize,
      maxViewportDims,
      maxRenderbufferSize,
      extensions,
      vertexShaderPrecision,
      fragmentShaderPrecision,
    };
  }

  _getShaderPrecision(gl, shaderType) {
    const precisions = {};
    for (const precision of ['LOW_FLOAT', 'MEDIUM_FLOAT', 'HIGH_FLOAT', 'LOW_INT', 'MEDIUM_INT', 'HIGH_INT']) {
      const format = gl.getShaderPrecisionFormat(shaderType, gl[precision]);
      if (format) {
        precisions[precision] = {
          rangeMin: format.rangeMin,
          rangeMax: format.rangeMax,
          precision: format.precision,
        };
      }
    }
    return precisions;
  }
}
