import { Collector } from '../collector.js';

export class WebGPUCollector extends Collector {
  constructor() {
    super('webgpu', 'WebGPU adapter info, features, and limits', []);
  }

  async collect() {
    if (!navigator.gpu) {
      return { supported: false };
    }

    let adapter;
    try {
      adapter = await navigator.gpu.requestAdapter();
    } catch {
      return { supported: false };
    }

    if (!adapter) {
      return { supported: false, adapterNull: true };
    }

    const info = adapter.info || {};

    // Collect all supported features
    const features = [];
    for (const f of adapter.features) {
      features.push(f);
    }
    features.sort();

    // Collect device limits
    const limitKeys = [
      'maxTextureDimension1D',
      'maxTextureDimension2D',
      'maxTextureDimension3D',
      'maxTextureArrayLayers',
      'maxBindGroups',
      'maxBindGroupsPlusVertexBuffers',
      'maxBindingsPerBindGroup',
      'maxDynamicUniformBuffersPerPipelineLayout',
      'maxDynamicStorageBuffersPerPipelineLayout',
      'maxSampledTexturesPerShaderStage',
      'maxSamplersPerShaderStage',
      'maxStorageBuffersPerShaderStage',
      'maxStorageTexturesPerShaderStage',
      'maxUniformBuffersPerShaderStage',
      'maxUniformBufferBindingSize',
      'maxStorageBufferBindingSize',
      'maxVertexBuffers',
      'maxBufferSize',
      'maxVertexAttributes',
      'maxVertexBufferArrayStride',
      'maxInterStageShaderVariables',
      'maxColorAttachments',
      'maxColorAttachmentBytesPerSample',
      'maxComputeWorkgroupStorageSize',
      'maxComputeInvocationsPerWorkgroup',
      'maxComputeWorkgroupSizeX',
      'maxComputeWorkgroupSizeY',
      'maxComputeWorkgroupSizeZ',
      'maxComputeWorkgroupsPerDimension',
    ];

    const limits = {};
    for (const key of limitKeys) {
      const val = adapter.limits[key];
      if (val !== undefined) {
        limits[key] = val;
      }
    }

    // Preferred canvas format
    let preferredFormat = null;
    try {
      preferredFormat = navigator.gpu.getPreferredCanvasFormat();
    } catch {
      // ignore
    }

    return {
      supported: true,
      vendor: info.vendor || null,
      architecture: info.architecture || null,
      device: info.device || null,
      description: info.description || null,
      features,
      limits,
      preferredFormat,
      isFallbackAdapter: adapter.isFallbackAdapter || false,
    };
  }
}
