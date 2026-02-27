import { Collector } from '../collector.js';

/**
 * Collects timezone and locale information as fingerprint signals.
 *
 * The IANA timezone, UTC offset, locale string, and calendar system
 * form a medium-entropy signal. Timezone alone narrows users to a
 * geographic region, and combined with locale/calendar it can
 * distinguish users across language and regional settings.
 */
export class TimezoneCollector extends Collector {
  constructor() {
    super('timezone', 'Timezone and locale information');
  }

  async collect() {
    const options = Intl.DateTimeFormat().resolvedOptions();

    return {
      timezone: options.timeZone ?? null,
      timezoneOffset: new Date().getTimezoneOffset(),
      locale: options.locale ?? null,
      calendar: options.calendar ?? null,
    };
  }
}
