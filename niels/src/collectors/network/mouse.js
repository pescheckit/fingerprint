import { Collector } from '../../collector.js';

export class MouseCollector extends Collector {
  constructor() {
    super('mouse', 'Mouse input characteristics', ['pointerType', 'wheelDeltaY', 'movementMinStep']);
    this._wheelDeltas = [];
    this._movementSteps = [];
    this._hasFractionalDelta = false;
    this._wheelDeltaMode = null;
    this._onWheel = null;
    this._onMouseMove = null;
    this._destroyed = false;
  }

  async collect() {
    const pointerType = matchMedia('(pointer: fine)').matches
      ? 'fine'
      : matchMedia('(pointer: coarse)').matches
        ? 'coarse'
        : 'none';

    const hoverSupport = matchMedia('(hover: hover)').matches;
    const maxTouchPoints = navigator.maxTouchPoints || 0;

    // Start background listeners
    this._startListeners();

    return {
      pointerType,
      hoverSupport,
      maxTouchPoints,
      observing: true,
    };
  }

  _startListeners() {
    if (this._destroyed) return;

    this._onWheel = (e) => {
      if (this._wheelDeltaMode === null) {
        this._wheelDeltaMode = e.deltaMode;
      }
      const dy = Math.abs(e.deltaY);
      if (dy > 0) {
        this._wheelDeltas.push(dy);
        if (dy !== Math.floor(dy)) {
          this._hasFractionalDelta = true;
        }
      }
    };

    this._onMouseMove = (e) => {
      const mx = Math.abs(e.movementX);
      const my = Math.abs(e.movementY);
      if (mx > 0) this._movementSteps.push(mx);
      if (my > 0) this._movementSteps.push(my);
    };

    document.addEventListener('wheel', this._onWheel, { passive: true });
    document.addEventListener('mousemove', this._onMouseMove, { passive: true });
  }

  observe(timeout = 10000) {
    return new Promise((resolve) => {
      const check = () => {
        if (this._destroyed) {
          resolve(this._buildResult());
          return;
        }
        if (this._movementSteps.length >= 50 && this._wheelDeltas.length >= 5) {
          resolve(this._buildResult());
          return;
        }
      };

      const interval = setInterval(check, 500);

      setTimeout(() => {
        clearInterval(interval);
        resolve(this._buildResult());
      }, timeout);

      // Check immediately in case we already have enough
      check();
    });
  }

  _buildResult() {
    const wheelDeltaY = this._mostCommon(this._wheelDeltas);
    const movementMinStep = this._movementSteps.length > 0
      ? Math.min(...this._movementSteps)
      : null;
    const movementMedianStep = this._median(this._movementSteps);

    return {
      wheelDeltaY,
      wheelDeltaMode: this._wheelDeltaMode,
      smoothScroll: this._hasFractionalDelta,
      movementMinStep,
      movementMedianStep,
      scrollSampleCount: this._wheelDeltas.length,
      moveSampleCount: this._movementSteps.length,
    };
  }

  _mostCommon(arr) {
    if (arr.length === 0) return null;
    const counts = {};
    for (const v of arr) {
      counts[v] = (counts[v] || 0) + 1;
    }
    let maxCount = 0;
    let maxVal = null;
    for (const [val, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        maxVal = Number(val);
      }
    }
    return maxVal;
  }

  _median(arr) {
    if (arr.length === 0) return null;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  destroy() {
    this._destroyed = true;
    if (this._onWheel) {
      document.removeEventListener('wheel', this._onWheel);
    }
    if (this._onMouseMove) {
      document.removeEventListener('mousemove', this._onMouseMove);
    }
  }
}
