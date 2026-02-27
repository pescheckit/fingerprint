import { StabilityBadge } from '../components'

export function StabilityTab({ stabilityScore }) {
  if (!stabilityScore) return null

  return (
    <section className="stability-section">
      <h2>Stability Analysis</h2>
      <p className="description">
        Shows how consistent each signal is across your {stabilityScore.totalVisits} visits.
        Higher scores mean the signal is more reliable for identification.
      </p>

      <div className="stability-overview">
        <div className="stability-meter">
          <div className="meter-label">Overall Stability</div>
          <div className="meter-bar">
            <div
              className="meter-fill"
              style={{ width: `${stabilityScore.overall}%` }}
            />
          </div>
          <div className="meter-value">{stabilityScore.overall}%</div>
        </div>

        <div className="stability-meter">
          <div className="meter-label">Fingerprint Consistency</div>
          <div className="meter-bar">
            <div
              className="meter-fill"
              style={{
                width: `${stabilityScore.fingerprintConsistency}%`,
                backgroundColor: stabilityScore.fingerprintConsistency === 100 ? '#22c55e' : '#f59e0b'
              }}
            />
          </div>
          <div className="meter-value">{stabilityScore.fingerprintConsistency}%</div>
        </div>
      </div>

      <h3>Component Stability</h3>
      <div className="stability-grid">
        {Object.entries(stabilityScore.components)
          .sort((a, b) => a[1].consistency - b[1].consistency)
          .map(([name, data]) => (
            <div key={name} className={`stability-item ${data.stable ? 'stable' : 'unstable'}`}>
              <div className="stability-item-header">
                <span className="stability-name">{name}</span>
                <StabilityBadge score={data.consistency} />
              </div>
              <div className="stability-bar">
                <div
                  className="stability-fill"
                  style={{ width: `${data.consistency}%` }}
                />
              </div>
              {data.variations > 1 && (
                <div className="stability-note">{data.variations} variations detected</div>
              )}
            </div>
          ))}
      </div>
    </section>
  )
}
