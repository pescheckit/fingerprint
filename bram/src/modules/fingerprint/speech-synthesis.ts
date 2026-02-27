/**
 * Speech Synthesis Module
 *
 * SCHOOL RESEARCH - Educational fingerprinting study
 * Different OSes have different voices installed
 *
 * Entropy: ~5 bits | Stability: 95% | Hardware-based: No
 */

import { ModuleInterface } from '../../types';

export class SpeechSynthesisModule implements ModuleInterface {
  name = 'speech-synthesis';
  entropy = 5;
  stability = 95;
  hardwareBased = false;

  isAvailable(): boolean {
    return 'speechSynthesis' in window;
  }

  collect(): any {
    if (!window.speechSynthesis) return null;

    const voices = window.speechSynthesis.getVoices();

    return {
      voices: voices.map(v => ({
        name: v.name,
        lang: v.lang,
        default: v.default,
        localService: v.localService
      })),
      voiceCount: voices.length,
      defaultVoice: voices.find(v => v.default)?.name || null,
      languages: [...new Set(voices.map(v => v.lang))],
      signature: this.hashVoices(voices)
    };
  }

  private hashVoices(voices: SpeechSynthesisVoice[]): string {
    const str = voices.map(v => `${v.name}:${v.lang}`).sort().join('|');
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }

    return Math.abs(hash).toString(36);
  }
}
