# Timezone Collector

## Overview

The Timezone collector gathers timezone and locale information from the browser's Intl API and Date object. These signals reveal the user's geographic region and language/calendar preferences, forming a **medium-entropy** fingerprint signal.

## Collected Signals

| Signal | Source | Description |
|---|---|---|
| `timezone` | `Intl.DateTimeFormat().resolvedOptions().timeZone` | IANA timezone string (e.g. `Europe/Amsterdam`) |
| `timezoneOffset` | `new Date().getTimezoneOffset()` | UTC offset in minutes (e.g. `-60` for UTC+1) |
| `locale` | `Intl.DateTimeFormat().resolvedOptions().locale` | BCP 47 locale tag (e.g. `en-US`, `nl-NL`) |
| `calendar` | `Intl.DateTimeFormat().resolvedOptions().calendar` | Calendar system (e.g. `gregory`, `japanese`, `islamic`) |

## How the Intl API Works

The `Intl.DateTimeFormat` constructor creates a locale-aware date formatter. Calling `resolvedOptions()` on it returns the fully resolved settings the browser would use, including:

- **timeZone** — the IANA timezone identifier derived from the OS timezone setting
- **locale** — the negotiated locale based on the browser's language preferences
- **calendar** — the calendar system associated with the locale

The `Date.getTimezoneOffset()` method returns the difference in minutes between UTC and the local timezone. Note that the sign is inverted: UTC+1 returns `-60`.

## Entropy and Uniqueness

**Rating: MEDIUM**

- There are ~400 IANA timezone identifiers, giving roughly 8-9 bits of entropy
- Timezone alone clusters users by geographic region (many users share the same timezone)
- Locale adds differentiation — `en-US` vs `en-GB` vs `nl-NL` within the same timezone
- Calendar is low-entropy (most users have `gregory`) but helps identify users with non-Gregorian calendar settings
- The combination of timezone + locale + offset is more distinctive than any single signal

## Browser Compatibility

All signals are universally supported:

- `Intl.DateTimeFormat` — supported in all modern browsers (IE 11+, all evergreen browsers)
- `Date.getTimezoneOffset()` — supported in all browsers since ES1
- `resolvedOptions()` — supported wherever `Intl.DateTimeFormat` is available

## Privacy Considerations

Timezone and locale are passively available to any page without permissions. They reveal:

- **Geographic region** — timezone narrows the user to a specific region or country
- **Language preference** — locale exposes the user's preferred language and regional variant
- **Cultural settings** — calendar system can indicate religious or cultural background

These signals are commonly accessed by internationalization libraries and analytics scripts. While individually they offer moderate entropy, combined with other collectors they contribute meaningfully to a unique fingerprint. Users can partially mitigate this through browser extensions that spoof timezone or locale values.
