import { Collector } from '../collector.js';

export class IntlCollector extends Collector {
  constructor() {
    super('intl', 'Intl API formatting quirks and locale data', []);
  }

  async collect() {
    if (typeof Intl === 'undefined') {
      return { supported: false };
    }

    return {
      supported: true,
      dateFormat: this._probeDateFormat(),
      numberFormat: this._probeNumberFormat(),
      currencyFormat: this._probeCurrencyFormat(),
      resolvedLocale: this._getResolvedLocale(),
      listFormat: this._probeListFormat(),
      pluralCategories: this._probePluralRules(),
      relativeTimeFormat: this._probeRelativeTime(),
      collation: this._probeCollation(),
      numberingSystems: this._probeNumberingSystems(),
      displayNames: this._probeDisplayNames(),
    };
  }

  _probeDateFormat() {
    try {
      const date = new Date(2025, 0, 15, 13, 45, 30);
      return {
        default: new Intl.DateTimeFormat().format(date),
        full: new Intl.DateTimeFormat('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          hour: 'numeric', minute: 'numeric', second: 'numeric',
          timeZoneName: 'long',
        }).format(date),
        parts: new Intl.DateTimeFormat('en-US', {
          year: 'numeric', month: 'long', day: 'numeric',
        }).formatToParts(date).map(p => p.type).join(','),
      };
    } catch {
      return null;
    }
  }

  _probeNumberFormat() {
    try {
      const n = 1234567.891;
      let compact = null;
      try {
        compact = new Intl.NumberFormat('en-US', { notation: 'compact' }).format(n);
      } catch {
        // notation: 'compact' not supported in this environment
      }
      return {
        default: new Intl.NumberFormat().format(n),
        decimal: new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 3 }).format(n),
        percent: new Intl.NumberFormat('en-US', { style: 'percent' }).format(0.456),
        compact,
        grouping: new Intl.NumberFormat('de-DE').format(n),
      };
    } catch {
      return null;
    }
  }

  _probeCurrencyFormat() {
    try {
      return {
        usd: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(1234.56),
        eur: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(1234.56),
        jpy: new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(1234),
      };
    } catch {
      return null;
    }
  }

  _getResolvedLocale() {
    try {
      const dtf = new Intl.DateTimeFormat();
      const opts = dtf.resolvedOptions();
      return {
        locale: opts.locale,
        calendar: opts.calendar,
        numberingSystem: opts.numberingSystem,
        timeZone: opts.timeZone,
      };
    } catch {
      return null;
    }
  }

  _probeListFormat() {
    try {
      if (!Intl.ListFormat) return null;
      const items = ['a', 'b', 'c'];
      return {
        conjunction: new Intl.ListFormat('en', { type: 'conjunction' }).format(items),
        disjunction: new Intl.ListFormat('en', { type: 'disjunction' }).format(items),
      };
    } catch {
      return null;
    }
  }

  _probePluralRules() {
    try {
      const pr = new Intl.PluralRules('en-US');
      return {
        select1: pr.select(1),
        select0: pr.select(0),
        select2: pr.select(2),
        selectFraction: pr.select(1.5),
        categories: [...new Set([0, 1, 2, 3, 5, 10, 100].map(n => pr.select(n)))],
      };
    } catch {
      return null;
    }
  }

  _probeRelativeTime() {
    try {
      if (!Intl.RelativeTimeFormat) return null;
      const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
      return {
        yesterday: rtf.format(-1, 'day'),
        tomorrow: rtf.format(1, 'day'),
        lastWeek: rtf.format(-1, 'week'),
      };
    } catch {
      return null;
    }
  }

  _probeCollation() {
    try {
      const collator = new Intl.Collator('en', { sensitivity: 'base' });
      return {
        aeOrder: collator.compare('ä', 'a'),
        caseOrder: collator.compare('a', 'A'),
        accentOrder: collator.compare('e', 'é'),
        resolvedSensitivity: new Intl.Collator().resolvedOptions().sensitivity,
        resolvedUsage: new Intl.Collator().resolvedOptions().usage,
      };
    } catch {
      return null;
    }
  }

  _probeNumberingSystems() {
    try {
      const systems = ['arab', 'beng', 'deva', 'latn', 'thai', 'hanidec'];
      const results = {};
      for (const ns of systems) {
        try {
          const fmt = new Intl.NumberFormat('en', { numberingSystem: ns });
          results[ns] = fmt.format(123);
        } catch {
          results[ns] = null;
        }
      }
      return results;
    } catch {
      return null;
    }
  }

  _probeDisplayNames() {
    try {
      if (!Intl.DisplayNames) return null;
      const dn = new Intl.DisplayNames('en', { type: 'language' });
      return {
        en: dn.of('en'),
        fr: dn.of('fr'),
        zh: dn.of('zh'),
        ar: dn.of('ar'),
      };
    } catch {
      return null;
    }
  }
}
