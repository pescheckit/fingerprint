import { StabilityBadge } from '../components'
import { formatComponentValue } from '../utils/formatters'

export function FingerprintJSTab({
  fingerprint,
  fpLoading,
  fpError,
  components,
  stabilityScore,
  copyToClipboard,
}) {
  return (
    <section className="fingerprintjs-section">
      <h2>FingerprintJS</h2>
      <p className="description">
        FingerprintJS is a browser fingerprinting library that generates a visitor identifier
        based on browser attributes. This ID is browser-specific and may differ across browsers.
      </p>

      {/* Visitor ID */}
      <div className="fpjs-id-section">
        <h3>Visitor ID</h3>
        {fpLoading ? (
          <div className="loading">Calculating visitor ID...</div>
        ) : fpError ? (
          <div className="error">Error: {fpError}</div>
        ) : (
          <div className="fingerprint-display">
            <code className="fingerprint-id">{fingerprint}</code>
            <button
              className="copy-btn"
              onClick={() => copyToClipboard(fingerprint)}
              title="Copy to clipboard"
            >
              Copy
            </button>
          </div>
        )}
      </div>

      {/* Components Table */}
      {components && (
        <div className="fpjs-components">
          <h3>Components ({Object.keys(components).length})</h3>
          <p className="description small">
            Individual browser attributes used to generate the visitor ID.
          </p>
          <div className="components-table">
            <table>
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Value</th>
                  <th>Duration</th>
                  {stabilityScore && <th>Stability</th>}
                </tr>
              </thead>
              <tbody>
                {Object.entries(components).map(([key, data]) => (
                  <tr key={key}>
                    <td className="component-name">{key}</td>
                    <td className="component-value">
                      {formatComponentValue(data.value)}
                    </td>
                    <td className="component-duration">
                      {data.duration !== undefined ? `${data.duration}ms` : '-'}
                    </td>
                    {stabilityScore && (
                      <td className="component-stability">
                        <StabilityBadge score={stabilityScore.components[key]?.consistency} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Component Stats */}
          <div className="fpjs-stats">
            <div className="stat-item">
              <span className="stat-label">Total Components:</span>
              <span className="stat-value">{Object.keys(components).length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Collection Time:</span>
              <span className="stat-value">
                {Object.values(components).reduce((sum, c) => sum + (c.duration || 0), 0)}ms
              </span>
            </div>
            {stabilityScore && (
              <div className="stat-item">
                <span className="stat-label">Stable Components:</span>
                <span className="stat-value">
                  {Object.values(stabilityScore.components).filter(c => c.stable).length} / {Object.keys(stabilityScore.components).length}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
