/**
 * Protocol Handler Detection Module
 * Entropy: ~6 bits
 * Stability: Very High (users rarely uninstall apps)
 * Hardware-based: No (but device-level)
 */
export default class ProtocolsModule {
  static name = 'protocols';
  static entropy = 6.0;
  static hardware = false;

  // Protocol handlers to test
  static protocols = {
    gaming: [
      { protocol: 'steam://', name: 'Steam' },
      { protocol: 'com.epicgames.launcher://', name: 'Epic Games' },
      { protocol: 'origin://', name: 'EA Origin' },
      { protocol: 'battlenet://', name: 'Battle.net' },
      { protocol: 'uplay://', name: 'Ubisoft Connect' }
    ],
    communication: [
      { protocol: 'discord://', name: 'Discord' },
      { protocol: 'slack://', name: 'Slack' },
      { protocol: 'zoommtg://', name: 'Zoom' },
      { protocol: 'msteams://', name: 'Microsoft Teams' },
      { protocol: 'skype://', name: 'Skype' },
      { protocol: 'tg://', name: 'Telegram' }
    ],
    development: [
      { protocol: 'vscode://', name: 'VS Code' },
      { protocol: 'idea://', name: 'IntelliJ IDEA' },
      { protocol: 'github-mac://', name: 'GitHub Desktop' },
      { protocol: 'gitkraken://', name: 'GitKraken' }
    ],
    media: [
      { protocol: 'spotify://', name: 'Spotify' },
      { protocol: 'itunes://', name: 'iTunes' },
      { protocol: 'vlc://', name: 'VLC' }
    ],
    crypto: [
      { protocol: 'metamask://', name: 'MetaMask' },
      { protocol: 'coinbase://', name: 'Coinbase' }
    ]
  };

  static isAvailable() {
    return typeof document !== 'undefined' && typeof window !== 'undefined';
  }

  static async collect() {
    const detected = [];
    const timeout = 1000; // 1 second timeout per protocol

    // Flatten all protocols
    const allProtocols = Object.values(this.protocols).flat();

    for (const { protocol, name } of allProtocols) {
      const isDetected = await this.testProtocol(protocol, timeout);
      if (isDetected) {
        detected.push(name);
      }
    }

    return {
      detected,
      count: detected.length
    };
  }

  static testProtocol(protocol, timeout) {
    return new Promise((resolve) => {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      let blurred = false;

      // Detect window blur (app launched)
      const onBlur = () => {
        blurred = true;
        cleanup();
        resolve(true);
      };

      // Cleanup function
      const cleanup = () => {
        window.removeEventListener('blur', onBlur);
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
        }
      };

      // Set timeout
      const timer = setTimeout(() => {
        cleanup();
        resolve(blurred);
      }, timeout);

      // Listen for blur
      window.addEventListener('blur', onBlur);

      // Try to open protocol
      try {
        iframe.contentWindow.location.href = protocol;
      } catch (e) {
        cleanup();
        clearTimeout(timer);
        resolve(false);
      }
    });
  }
}
