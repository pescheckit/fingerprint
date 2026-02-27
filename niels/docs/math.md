# Math Fingerprinting

## How It Works

Browser fingerprinting through math operations exploits the fact that different JavaScript engines (V8, SpiderMonkey, JavaScriptCore) and different platforms use different underlying math library implementations. While the IEEE 754 standard guarantees consistent behavior for basic arithmetic (+, -, *, /), transcendental functions like `sin`, `cos`, `tan`, `exp`, `log`, etc. are **not** required to produce bit-identical results across implementations.

These differences arise because:

- **Different libm implementations**: V8 may use fdlibm while SpiderMonkey uses the system's libm, leading to tiny differences in the least significant bits of floating-point results.
- **Platform-specific optimizations**: Some engines use hardware-accelerated math instructions (e.g. x87 FPU vs SSE) that produce slightly different rounding.
- **Edge-case handling**: Operations at extreme values (like `Math.tan(-1e300)`) can produce wildly different results depending on argument reduction algorithms.

The collector evaluates 17 math operations and returns their raw floating-point results. The combined set of values forms a fingerprint that can distinguish between browser engines.

## Entropy

**LOW-MEDIUM**

Math results tend to cluster by browser engine rather than by individual user. All Chrome users on the same platform typically produce identical math results. This means the signal has relatively few distinct values in practice, but it is useful for distinguishing browser families (Chrome vs Firefox vs Safari) and can contribute meaningfully when combined with other signals.

## Browser Compatibility

**Universal**. The `Math` object and all operations used by this collector are part of the ECMAScript specification and are available in every browser, including:

- All modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome for Android)
- Older browsers (IE 11+)
- Node.js and other JS runtimes

No feature detection or fallbacks are needed.

## Privacy Considerations

- Math fingerprinting is **passive** — it does not require any user interaction or permissions.
- It cannot be blocked by disabling cookies or clearing storage.
- Browser privacy modes (incognito/private) do not affect math results.
- Some anti-fingerprinting browsers (Tor Browser, Brave) may add noise to math results or standardize them to reduce fingerprintability.
- The signal is engine-level, not user-level, so it identifies browser type more than individual users.
