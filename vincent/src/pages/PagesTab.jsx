import { useHistoryProbe } from '../hooks/useHistoryProbe'

export function PagesTab({ trackedPages, pagesLoading, pagesLocal, openPages, currentTabId }) {
  const {
    results: probeResults,
    summary: probeSummary,
    loading: probeLoading,
    runProbe,
  } = useHistoryProbe()

  return (
    <section className="pages-section">
      <h2>Page Tracking</h2>
      <p className="description">
        Track pages and detect browsing history using fingerprinting techniques.
        {pagesLocal && <span className="local-note"> (stored locally - API unavailable)</span>}
      </p>

      {/* History Probe Section */}
      <div className="history-probe-section">
        <h3>History Detection</h3>
        <p className="description small">
          Detect which popular sites may have been visited using cache timing analysis.
          These techniques exploit browser caching behavior and timing side-channels.
        </p>

        <div className="probe-controls">
          <button
            className="probe-btn"
            onClick={() => runProbe('favicon')}
            disabled={probeLoading}
          >
            {probeLoading ? 'Probing...' : 'Run Cache Probe'}
          </button>
          <span className="probe-note">
            Detects ~{15} popular sites via favicon cache timing
          </span>
        </div>

        {probeResults.length > 0 && (
          <div className="probe-results">
            <div className="probe-summary">
              <span className="summary-label">Detected:</span>
              <span className="summary-value">
                {probeSummary.probablyVisited} / {probeSummary.total} sites
              </span>
              {probeSummary.sites.length > 0 && (
                <span className="summary-sites">
                  ({probeSummary.sites.join(', ')})
                </span>
              )}
            </div>

            <details className="probe-details">
              <summary>View all probe results</summary>
              <div className="probe-table">
                <table>
                  <thead>
                    <tr>
                      <th>Site</th>
                      <th>Load Time</th>
                      <th>Detected</th>
                      <th>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {probeResults
                      .filter(r => r.method === 'favicon_cache')
                      .map((result, i) => (
                        <tr key={i} className={result.probablyVisited ? 'detected' : ''}>
                          <td>{result.site}</td>
                          <td>
                            {result.error ? 'Error' :
                              result.timeout ? 'Timeout' :
                                `${result.loadTime?.toFixed(1)}ms`}
                          </td>
                          <td>
                            {result.probablyVisited ? (
                              <span className="detected-badge">Yes</span>
                            ) : (
                              <span className="not-detected">No</span>
                            )}
                          </td>
                          <td className={`confidence ${result.confidence}`}>
                            {result.confidence}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </details>

            <div className="probe-disclaimer">
              <strong>Note:</strong> These results are probabilistic. Modern browsers have
              mitigations against history sniffing. Fast load times may indicate cached
              resources from prior visits, but this is not definitive proof.
            </div>
          </div>
        )}
      </div>

      {/* Currently Open Pages */}
      <div className="open-pages-section">
        <h3>Currently Open ({openPages?.length || 0})</h3>
        <p className="description small">
          Pages this device currently has open across all browser tabs.
        </p>

        {openPages && openPages.length > 0 ? (
          <div className="pages-list open">
            {openPages.map((page) => (
              <div
                key={page.tabId}
                className={`page-item open ${page.tabId === currentTabId ? 'current' : ''}`}
              >
                <div className="page-status">
                  <span className="status-dot" />
                  {page.tabId === currentTabId && <span className="current-badge">This tab</span>}
                </div>
                <div className="page-main">
                  <span className="page-title">{page.title || 'Untitled'}</span>
                  <span className="page-url">{page.path || page.url}</span>
                </div>
                <div className="page-stats">
                  <span className="page-time">
                    Opened {formatTimeAgo(page.openedAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data small">
            No open pages detected.
          </div>
        )}
      </div>

      {/* All Tracked Pages */}
      <div className="tracked-pages-section">
        <h3>All Tracked Pages ({trackedPages?.length || 0})</h3>
        <p className="description small">
          Complete history of pages visited by this device.
        </p>

        {pagesLoading ? (
          <div className="loading">Loading tracked pages...</div>
        ) : trackedPages && trackedPages.length > 0 ? (
          <div className="pages-list tracked">
            {trackedPages.map((page, i) => {
              const isOpen = openPages?.some(op => op.url === page.url)
              return (
                <div key={page.id || i} className={`page-item tracked ${isOpen ? 'is-open' : ''}`}>
                  {isOpen && (
                    <div className="page-status">
                      <span className="status-dot" />
                    </div>
                  )}
                  <div className="page-main">
                    <span className="page-title">
                      {page.title || 'Untitled'}
                      {isOpen && <span className="open-indicator">OPEN</span>}
                    </span>
                    <span className="page-url">{page.path || page.url}</span>
                  </div>
                  <div className="page-stats">
                    <span className="page-visits">
                      {page.visitCount} visit{page.visitCount > 1 ? 's' : ''}
                    </span>
                    <span className="page-time">
                      First: {formatDate(page.firstVisitAt)}
                    </span>
                    <span className="page-time">
                      Last: {formatDate(page.lastVisitAt)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="no-data">
            No pages tracked yet for this device.
          </div>
        )}
      </div>
    </section>
  )
}

function formatTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatDate(timestamp) {
  if (!timestamp) return 'Unknown'
  const date = new Date(timestamp)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
