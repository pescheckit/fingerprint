export function OverviewTab({
  fingerprint,
  deviceFingerprint,
  fpLoading,
  fpError,
  signalsLoading,
  visitor,
  stabilityScore,
  visitCount,
  copyToClipboard,
}) {
  return (
    <>
      <section className="fingerprint-section">
        <h2>Device Fingerprint</h2>
        {signalsLoading ? (
          <div className="loading">Calculating device fingerprint...</div>
        ) : deviceFingerprint ? (
          <>
            <div className="fingerprint-display device-fp">
              <code className="fingerprint-id device">{deviceFingerprint.id}</code>
              <button
                className="copy-btn"
                onClick={() => copyToClipboard(deviceFingerprint.id)}
                title="Copy to clipboard"
              >
                Copy
              </button>
            </div>
            <div className="device-fp-stats">
              <span className="stat">{deviceFingerprint.signalsUsed} signals</span>
              <span className="stat">~{deviceFingerprint.entropy} bits entropy</span>
            </div>
            {deviceFingerprint.rawSignals && (
              <details className="debug-signals">
                <summary>Debug: View raw signals</summary>
                <div className="debug-content">
                  {deviceFingerprint.rawSignals.map((signal, i) => (
                    <code key={i} className="debug-signal">{signal}</code>
                  ))}
                </div>
              </details>
            )}
          </>
        ) : (
          <div className="error">Unable to generate device fingerprint</div>
        )}
        <p className="description">
          Cross-browser device identifier. Uses hardware-level signals
          that remain stable regardless of which browser you use.
        </p>

        <div className="visitor-id-section">
          <h3>Browser Visitor ID (FingerprintJS)</h3>
          {fpLoading ? (
            <div className="loading small">Calculating...</div>
          ) : fpError ? (
            <div className="error small">Error: {fpError}</div>
          ) : (
            <div className="fingerprint-display small">
              <code className="fingerprint-id small">{fingerprint}</code>
              <button
                className="copy-btn small"
                onClick={() => copyToClipboard(fingerprint)}
                title="Copy to clipboard"
              >
                Copy
              </button>
            </div>
          )}
          <p className="description small">
            FingerprintJS visitor ID (browser-specific, may differ across browsers).
            See the FingerprintJS tab for detailed components.
          </p>
        </div>
      </section>

      {visitor && (
        <div className="database-info">
          <h3>Database Record</h3>
          <div className="db-fields">
            <div className="db-field">
              <span className="db-label">Visitor ID:</span>
              <span className="db-value">{visitor.id}</span>
            </div>
            <div className="db-field">
              <span className="db-label">First Seen:</span>
              <span className="db-value">{new Date(visitor.firstSeenAt).toLocaleString()}</span>
            </div>
            <div className="db-field">
              <span className="db-label">Last Seen:</span>
              <span className="db-value">{new Date(visitor.lastSeenAt).toLocaleString()}</span>
            </div>
            <div className="db-field">
              <span className="db-label">Total Visits:</span>
              <span className="db-value">{visitor.visitCount}</span>
            </div>
          </div>
        </div>
      )}

      {stabilityScore && (
        <div className="quick-stats">
          <div className="stat-card">
            <div className="stat-value">{stabilityScore.overall}%</div>
            <div className="stat-label">Overall Stability</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stabilityScore.fingerprintConsistency}%</div>
            <div className="stat-label">Fingerprint Consistency</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{visitCount}</div>
            <div className="stat-label">Total Visits</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stabilityScore.uniqueFingerprints}</div>
            <div className="stat-label">Unique IDs</div>
          </div>
        </div>
      )}
    </>
  )
}
