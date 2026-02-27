/**
 * Timezone and Locale Module
 * Entropy: ~3.5 bits
 * Stability: High
 * Hardware-based: No
 */
export default class TimezoneModule {
  static name = 'timezone';
  static entropy = 3.5;
  static hardware = false;

  static isAvailable() {
    return true;
  }

  static collect() {
    const date = new Date();

    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: date.getTimezoneOffset(),

      // Locale information
      locale: Intl.DateTimeFormat().resolvedOptions().locale,
      calendar: Intl.DateTimeFormat().resolvedOptions().calendar,
      numberingSystem: Intl.DateTimeFormat().resolvedOptions().numberingSystem,

      // Date formatting
      dateFormat: date.toLocaleDateString(),
      timeFormat: date.toLocaleTimeString(),

      // Language
      language: navigator.language,
      languages: navigator.languages,

      // Date string samples
      samples: {
        date: new Date(2026, 0, 1).toLocaleDateString(),
        time: new Date(2026, 0, 1, 13, 30, 45).toLocaleTimeString(),
        dateTime: new Date(2026, 0, 1, 13, 30, 45).toLocaleString()
      }
    };
  }
}
