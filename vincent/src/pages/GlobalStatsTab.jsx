import { RecentVisitRow } from '../components'

export function GlobalStatsTab({ stats, statsLoading }) {
  return (
    <section className="global-stats-section">
      <h2>{stats?.isLocal ? 'Local Statistics' : 'Global Statistics'}</h2>
      <p className="description">
        {stats?.isLocal
          ? 'Showing local browser data (API unavailable in dev mode).'
          : 'Aggregated data from all visitors stored in the database.'}
      </p>

      {statsLoading ? (
        <div className="loading">Loading global statistics...</div>
      ) : stats ? (
        <>
          <div className="quick-stats">
            <div className="stat-card">
              <div className="stat-value">{stats.totalVisitors}</div>
              <div className="stat-label">Total Visitors</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.totalVisits}</div>
              <div className="stat-label">Total Visits</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.returningRate}%</div>
              <div className="stat-label">Returning Rate</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.avgVisitsPerVisitor}</div>
              <div className="stat-label">Avg Visits/Visitor</div>
            </div>
          </div>

          <div className="global-details">
            <div className="detail-card">
              <h3>Visitor Breakdown</h3>
              <div className="detail-row">
                <span>Unique Visitors:</span>
                <span>{stats.totalVisitors}</span>
              </div>
              <div className="detail-row">
                <span>Returning Visitors:</span>
                <span>{stats.returningVisitors}</span>
              </div>
              <div className="detail-row">
                <span>Visits (Last 24h):</span>
                <span>{stats.visitsLast24h}</span>
              </div>
            </div>

            {stats.latestVisits && stats.latestVisits.length > 0 && (
              <div className="detail-card">
                <h3>Recent Visits</h3>
                <div className="recent-visits">
                  {stats.latestVisits.map((visit, i) => (
                    <RecentVisitRow key={i} visit={visit} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="no-data">No statistics available yet.</div>
      )}
    </section>
  )
}
