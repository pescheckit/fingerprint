/**
 * WebGPU Module - Advanced GPU fingerprinting
 * Entropy: ~18 bits | Stability: 90% | Hardware-based: Yes
 *
 * Educational Research: Based on LockedApart (2025) research paper
 * This module studies WebGPU capabilities for device fingerprinting research.
 *
 * WebGPU provides rich hardware information including:
 * - GPU adapter details (vendor, architecture)
 * - Feature sets (specific GPU capabilities)
 * - Hardware limits (memory, compute capabilities)
 * - Optional: Compute shader timing patterns
 *
 * References:
 * - LockedApart: Using WebGPU for Browser Fingerprinting (2025)
 * - WebGPU Specification: https://www.w3.org/TR/webgpu/
 */

import { ModuleInterface } from '../../types';

export class WebGPUModule implements ModuleInterface {
  name = 'webgpu';
  entropy = 18;
  stability = 90;
  hardwareBased = true;

  isAvailable(): boolean {
    return typeof navigator !== 'undefined' && 'gpu' in navigator;
  }

  async collect(): Promise<any> {
    try {
      // Request GPU adapter
      const adapter = await navigator.gpu?.requestAdapter();

      if (!adapter) {
        return {
          available: false,
          error: 'No adapter available'
        };
      }

      // Collect adapter information
      const adapterInfo = adapter.info || ({} as GPUAdapterInfo);

      // Collect supported features
      const features = Array.from(adapter.features || []).sort();

      // Collect hardware limits
      const limits = this.collectLimits(adapter.limits);

      // Request device for additional info
      let deviceInfo = null;
      try {
        const device = await adapter.requestDevice();
        deviceInfo = {
          queue: {
            label: device.queue.label || 'default'
          }
        };

        // Attempt compute shader timing (optional, may fail)
        const timingResult = await this.performComputeTiming(device);
        if (timingResult) {
          deviceInfo.timing = timingResult;
        }

        // Clean up
        device.destroy();
      } catch (e) {
        // Device request may fail, continue without it
        deviceInfo = { error: 'Device request failed' };
      }

      // Generate signature hash
      const signature = this.generateSignature({
        vendor: adapterInfo.vendor,
        architecture: adapterInfo.architecture,
        device: adapterInfo.device,
        description: adapterInfo.description,
        features,
        limits
      });

      return {
        available: true,
        adapter: {
          vendor: adapterInfo.vendor || 'unknown',
          architecture: adapterInfo.architecture || 'unknown',
          device: adapterInfo.device || 'unknown',
          description: adapterInfo.description || 'unknown'
        },
        features,
        featuresCount: features.length,
        limits,
        device: deviceInfo,
        signature,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Collect important GPU limits for fingerprinting
   * Educational note: These limits reveal specific GPU hardware capabilities
   */
  private collectLimits(limits: GPUSupportedLimits): Record<string, number> {
    const importantLimits = [
      'maxTextureDimension1D',
      'maxTextureDimension2D',
      'maxTextureDimension3D',
      'maxTextureArrayLayers',
      'maxBindGroups',
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
      'maxInterStageShaderComponents',
      'maxComputeWorkgroupStorageSize',
      'maxComputeInvocationsPerWorkgroup',
      'maxComputeWorkgroupSizeX',
      'maxComputeWorkgroupSizeY',
      'maxComputeWorkgroupSizeZ',
      'maxComputeWorkgroupsPerDimension'
    ];

    const result: Record<string, number> = {};

    for (const limit of importantLimits) {
      if (limit in limits) {
        result[limit] = (limits as any)[limit];
      }
    }

    return result;
  }

  /**
   * Perform simple compute shader timing test
   * Educational note: Timing patterns can reveal GPU architecture characteristics
   * Based on LockedApart research - timing variations are hardware-specific
   */
  private async performComputeTiming(device: GPUDevice): Promise<any> {
    try {
      // Simple compute shader for timing analysis
      const shaderCode = `
        @group(0) @binding(0) var<storage, read_write> data: array<f32>;

        @compute @workgroup_size(64)
        fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
          let idx = global_id.x;
          if (idx < arrayLength(&data)) {
            // Simple computation: repeated operations to measure timing
            var value = data[idx];
            for (var i = 0u; i < 100u; i = i + 1u) {
              value = value * 1.01 + 0.5;
              value = sqrt(value);
            }
            data[idx] = value;
          }
        }
      `;

      const shaderModule = device.createShaderModule({
        code: shaderCode
      });

      // Create buffer for computation
      const bufferSize = 256 * 4; // 256 floats
      const buffer = device.createBuffer({
        size: bufferSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
      });

      // Initialize data
      const inputData = new Float32Array(256).fill(1.0);
      device.queue.writeBuffer(buffer, 0, inputData);

      // Create compute pipeline
      const pipeline = device.createComputePipeline({
        layout: 'auto',
        compute: {
          module: shaderModule,
          entryPoint: 'main'
        }
      });

      // Create bind group
      const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [{
          binding: 0,
          resource: { buffer }
        }]
      });

      // Execute and measure timing
      const startTime = performance.now();

      const commandEncoder = device.createCommandEncoder();
      const passEncoder = commandEncoder.beginComputePass();
      passEncoder.setPipeline(pipeline);
      passEncoder.setBindGroup(0, bindGroup);
      passEncoder.dispatchWorkgroups(Math.ceil(256 / 64));
      passEncoder.end();

      device.queue.submit([commandEncoder.finish()]);
      await device.queue.onSubmittedWorkDone();

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Clean up
      buffer.destroy();

      return {
        computeDuration: Math.round(duration * 1000) / 1000, // Round to 3 decimals
        workgroupSize: 64,
        dispatchSize: Math.ceil(256 / 64)
      };
    } catch (error) {
      // Timing test is optional, return null if it fails
      return null;
    }
  }

  /**
   * Generate a signature hash from GPU information
   */
  private generateSignature(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}
