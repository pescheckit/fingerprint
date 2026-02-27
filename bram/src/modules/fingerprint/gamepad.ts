/**
 * Gamepad API Module - Connected gamepad detection and capabilities
 * Entropy: ~4 bits | Stability: 95% | Hardware-based: Yes
 *
 * Detects connected gamepads, their capabilities, and unique identifiers.
 * Different users have different gaming peripherals connected.
 *
 * Research Techniques:
 * - Gamepad enumeration (connected controllers)
 * - Button/axis configuration detection
 * - Vendor/product identification
 * - Haptic feedback capability detection
 */

import { ModuleInterface } from '../../types';

export class GamepadModule implements ModuleInterface {
  name = 'gamepad';
  entropy = 4;
  stability = 95;
  hardwareBased = true;

  isAvailable(): boolean {
    return typeof navigator !== 'undefined' && 'getGamepads' in navigator;
  }

  collect(): any {
    try {
      // Get all connected gamepads
      const gamepads = navigator.getGamepads();

      if (!gamepads) {
        return { available: false, count: 0 };
      }

      const connectedGamepads = Array.from(gamepads)
        .filter(gamepad => gamepad !== null)
        .map(gamepad => this.extractGamepadInfo(gamepad));

      return {
        available: true,
        count: connectedGamepads.length,
        gamepads: connectedGamepads,
        maxGamepads: gamepads.length,
        fingerprint: this.generateFingerprint(connectedGamepads)
      };

    } catch (error) {
      return {
        available: false,
        error: 'gamepad_detection_failed'
      };
    }
  }

  /**
   * Extract detailed information from a gamepad
   * Each gamepad has unique characteristics that can be fingerprinted
   */
  private extractGamepadInfo(gamepad: Gamepad): any {
    return {
      // Gamepad identification
      id: gamepad.id,                           // Full gamepad identifier string
      index: gamepad.index,                     // Gamepad slot index

      // Connection info
      connected: gamepad.connected,
      timestamp: gamepad.timestamp,

      // Hardware capabilities
      mapping: gamepad.mapping,                 // Standard vs non-standard mapping
      buttons: {
        count: gamepad.buttons.length,
        types: this.categorizeButtons(gamepad.buttons)
      },
      axes: {
        count: gamepad.axes.length,
        range: this.getAxesRange(gamepad.axes)
      },

      // Haptic feedback capabilities (Gamepad API extensions)
      hapticActuators: this.detectHaptics(gamepad),

      // Vendor/product detection from ID string
      vendor: this.extractVendor(gamepad.id),

      // Create a simple hash of the gamepad configuration
      configHash: this.hashConfig(gamepad)
    };
  }

  /**
   * Categorize button types (pressed, touched, analog pressure)
   * Different controllers support different button features
   */
  private categorizeButtons(buttons: readonly GamepadButton[]): any {
    const categories = {
      digital: 0,      // Simple on/off buttons
      analog: 0,       // Pressure-sensitive buttons
      touched: 0       // Touch-sensitive buttons
    };

    for (const button of buttons) {
      if (button.value > 0 && button.value < 1) {
        categories.analog++;
      }
      if ('touched' in button && button.touched) {
        categories.touched++;
      } else {
        categories.digital++;
      }
    }

    return categories;
  }

  /**
   * Analyze axes range and sensitivity
   * Different controllers have different axis characteristics
   */
  private getAxesRange(axes: readonly number[]): any {
    if (axes.length === 0) {
      return { min: 0, max: 0, unique: 0 };
    }

    const uniqueValues = new Set(axes.map(v => Math.round(v * 1000))).size;

    return {
      min: Math.min(...axes),
      max: Math.max(...axes),
      unique: uniqueValues
    };
  }

  /**
   * Detect haptic feedback capabilities
   * Modern gamepads support vibration and haptic effects
   */
  private detectHaptics(gamepad: Gamepad): any {
    try {
      // Check for vibration actuators (Gamepad Extensions API)
      const vibrationActuator = (gamepad as any).vibrationActuator;

      if (vibrationActuator) {
        return {
          supported: true,
          type: vibrationActuator.type || 'unknown',
          effects: vibrationActuator.effects || []
        };
      }

      // Check for haptic actuators (newer API)
      const hapticActuators = (gamepad as any).hapticActuators;

      if (hapticActuators && hapticActuators.length > 0) {
        return {
          supported: true,
          count: hapticActuators.length,
          types: hapticActuators.map((h: any) => h.type)
        };
      }

      return { supported: false };
    } catch {
      return { supported: false };
    }
  }

  /**
   * Extract vendor information from gamepad ID
   * Gamepad ID often contains vendor and product codes
   * Format: "VendorName Controller (STANDARD GAMEPAD Vendor: 045e Product: 02ea)"
   */
  private extractVendor(id: string): any {
    // Extract vendor and product IDs from the ID string
    const vendorMatch = id.match(/Vendor:\s*([0-9a-fA-F]+)/);
    const productMatch = id.match(/Product:\s*([0-9a-fA-F]+)/);

    // Extract controller name (usually at the start)
    const nameMatch = id.match(/^([^(]+)/);

    return {
      name: nameMatch ? nameMatch[1].trim() : 'unknown',
      vendorId: vendorMatch ? vendorMatch[1] : null,
      productId: productMatch ? productMatch[1] : null,
      fullId: id
    };
  }

  /**
   * Create a hash of the gamepad configuration
   * Used for quick fingerprinting
   */
  private hashConfig(gamepad: Gamepad): string {
    const configString = [
      gamepad.id,
      gamepad.mapping,
      gamepad.buttons.length,
      gamepad.axes.length
    ].join('|');

    return this.simpleHash(configString);
  }

  /**
   * Generate a composite fingerprint from all connected gamepads
   */
  private generateFingerprint(gamepads: any[]): string {
    if (gamepads.length === 0) {
      return 'no_gamepads';
    }

    const fingerprintData = gamepads.map(g => {
      return [
        g.configHash,
        g.buttons.count,
        g.axes.count,
        g.hapticActuators.supported ? '1' : '0',
        g.vendor.vendorId || 'unknown'
      ].join(':');
    }).join('|');

    return this.simpleHash(fingerprintData);
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }
}
