import { formatTimeSince } from '../utils/formatters'

export function ChangesTab({ comparison }) {
  if (!comparison) return null

  return (
    <section className="changes-section">
      <h2>Changes Since Last Visit</h2>
      <p className="description">
        Comparing your current visit with your previous one
        ({formatTimeSince(comparison.timeSinceLastVisit)} ago).
      </p>

      <div className={`fingerprint-comparison ${comparison.fingerprintMatch ? 'match' : 'mismatch'}`}>
        <div className="comparison-icon">
          {comparison.fingerprintMatch ? '✓' : '✗'}
        </div>
        <div className="comparison-text">
          {comparison.fingerprintMatch
            ? 'Fingerprint ID is identical to your last visit'
            : 'Fingerprint ID has changed since your last visit'}
        </div>
      </div>

      {comparison.componentChanges.length === 0 && comparison.signalChanges.length === 0 ? (
        <div className="no-changes">
          <span className="no-changes-icon">✨</span>
          <p>No changes detected! All signals are identical to your last visit.</p>
        </div>
      ) : (
        <>
          {comparison.componentChanges.length > 0 && (
            <>
              <h3>Component Changes ({comparison.componentChanges.length})</h3>
              <div className="changes-table">
                <table>
                  <thead>
                    <tr>
                      <th>Component</th>
                      <th>Previous</th>
                      <th>Current</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.componentChanges.map((change, i) => (
                      <tr key={i}>
                        <td className="change-name">{change.name}</td>
                        <td className="change-prev">{change.previous}</td>
                        <td className="change-curr">{change.current}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {comparison.signalChanges.length > 0 && (
            <>
              <h3>Signal Changes ({comparison.signalChanges.length})</h3>
              <div className="changes-table">
                <table>
                  <thead>
                    <tr>
                      <th>Signal</th>
                      <th>Previous</th>
                      <th>Current</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.signalChanges.map((change, i) => (
                      <tr key={i}>
                        <td className="change-name">{change.category}.{change.name}</td>
                        <td className="change-prev">{change.previous}</td>
                        <td className="change-curr">{change.current}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </section>
  )
}
