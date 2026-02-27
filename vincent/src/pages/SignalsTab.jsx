import { useState } from 'react'
import { SignalCard } from '../components'
import { useHistoryProbe } from '../hooks'

export function SignalsTab({ signals, signalsLoading, stabilityScore, expandedSections, toggleSection }) {
  const [sectionCollapsed, setSectionCollapsed] = useState({
    hardware: false,
    software: false,
    storage: false,
    browsing: false,
    history: false,
  })
  const { results: historyResults, summary: historySummary, loading: historyLoading, progress: historyProgress, runProbe } = useHistoryProbe()

  const toggleSectionCollapse = (section) => {
    setSectionCollapsed((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  if (signalsLoading) {
    return (
      <section className="signals-section">
        <h2>Collected Signals</h2>
        <div className="loading">Collecting browser signals...</div>
      </section>
    )
  }

  return (
    <section className="signals-section">
      <h2>Collected Signals</h2>

      {/* Hardware Signals Section */}
      <div className="signals-category">
        <div
          className="signals-category-header"
          onClick={() => toggleSectionCollapse('hardware')}
        >
          <span className="category-icon">🔧</span>
          <h3>Hardware Signals</h3>
          <span className="category-count">
            {countHardwareSignals(signals)} signals
          </span>
          <span className="category-toggle">
            {sectionCollapsed.hardware ? '+' : '−'}
          </span>
        </div>

        {!sectionCollapsed.hardware && (
          <div className="signals-grid">
            <SignalCard
              title="Screen"
              icon="🖥️"
              data={signals?.screen}
              stability={stabilityScore?.signals?.screen}
              expanded={expandedSections.screen}
              onToggle={() => toggleSection('screen')}
            />
            <SignalCard
              title="WebGL"
              icon="🎮"
              data={signals?.webgl}
              stability={stabilityScore?.signals?.webgl}
              expanded={expandedSections.webgl}
              onToggle={() => toggleSection('webgl')}
            />
            {signals?.webglRender && (
              <SignalCard
                title="WebGL Render"
                icon="🎯"
                data={signals.webglRender}
                stability={stabilityScore?.signals?.webglRender}
                expanded={expandedSections.webglRender}
                onToggle={() => toggleSection('webglRender')}
              />
            )}
            <SignalCard
              title="Audio"
              icon="🔊"
              data={signals?.audio}
              stability={stabilityScore?.signals?.audio}
              expanded={expandedSections.audio}
              onToggle={() => toggleSection('audio')}
            />
            {signals?.mediaDevices && (
              <SignalCard
                title="Media Devices"
                icon="🎥"
                data={signals.mediaDevices}
                stability={stabilityScore?.signals?.mediaDevices}
                expanded={expandedSections.mediaDevices}
                onToggle={() => toggleSection('mediaDevices')}
              />
            )}
            {signals?.battery && (
              <SignalCard
                title="Battery"
                icon="🔋"
                data={signals.battery}
                stability={stabilityScore?.signals?.battery}
                expanded={expandedSections.battery}
                onToggle={() => toggleSection('battery')}
              />
            )}
          </div>
        )}
      </div>

      {/* Software/Browser Signals Section */}
      <div className="signals-category">
        <div
          className="signals-category-header"
          onClick={() => toggleSectionCollapse('software')}
        >
          <span className="category-icon">💻</span>
          <h3>Software Signals</h3>
          <span className="category-count">
            {countSoftwareSignals(signals)} signals
          </span>
          <span className="category-toggle">
            {sectionCollapsed.software ? '+' : '−'}
          </span>
        </div>

        {!sectionCollapsed.software && (
          <div className="signals-grid">
            <SignalCard
              title="Navigator"
              icon="🧭"
              data={signals?.navigator}
              stability={stabilityScore?.signals?.navigator}
              expanded={expandedSections.navigator}
              onToggle={() => toggleSection('navigator')}
            />
            <SignalCard
              title="Timezone"
              icon="🌍"
              data={signals?.timezone}
              stability={stabilityScore?.signals?.timezone}
              expanded={expandedSections.timezone}
              onToggle={() => toggleSection('timezone')}
            />
            <SignalCard
              title="Canvas"
              icon="🎨"
              data={signals?.canvas}
              stability={stabilityScore?.signals?.canvas}
              expanded={expandedSections.canvas}
              onToggle={() => toggleSection('canvas')}
            />
            <SignalCard
              title="Fonts"
              icon="✏️"
              data={signals?.fonts}
              stability={stabilityScore?.signals?.fonts}
              expanded={expandedSections.fonts}
              onToggle={() => toggleSection('fonts')}
            />
            {signals?.fontsDetailed && (
              <SignalCard
                title="Fonts (Detailed)"
                icon="🔤"
                data={signals.fontsDetailed}
                stability={stabilityScore?.signals?.fontsDetailed}
                expanded={expandedSections.fontsDetailed}
                onToggle={() => toggleSection('fontsDetailed')}
              />
            )}
            {signals?.speechVoices && (
              <SignalCard
                title="Speech Voices"
                icon="🗣️"
                data={signals.speechVoices}
                stability={stabilityScore?.signals?.speechVoices}
                expanded={expandedSections.speechVoices}
                onToggle={() => toggleSection('speechVoices')}
              />
            )}
            {signals?.mathFingerprint && (
              <SignalCard
                title="Math Engine"
                icon="🔢"
                data={signals.mathFingerprint}
                stability={stabilityScore?.signals?.mathFingerprint}
                expanded={expandedSections.mathFingerprint}
                onToggle={() => toggleSection('mathFingerprint')}
              />
            )}
            {signals?.system && (
              <SignalCard
                title="System"
                icon="💻"
                data={signals.system}
                stability={stabilityScore?.signals?.system}
                expanded={expandedSections.system}
                onToggle={() => toggleSection('system')}
              />
            )}
            {signals?.connection && (
              <SignalCard
                title="Connection"
                icon="📶"
                data={signals.connection}
                stability={stabilityScore?.signals?.connection}
                expanded={expandedSections.connection}
                onToggle={() => toggleSection('connection')}
              />
            )}
            {signals?.webrtc && (
              <SignalCard
                title="WebRTC"
                icon="📡"
                data={signals.webrtc}
                stability={stabilityScore?.signals?.webrtc}
                expanded={expandedSections.webrtc}
                onToggle={() => toggleSection('webrtc')}
              />
            )}
            {signals?.ipInfo && (
              <SignalCard
                title="IP Address"
                icon="🌐"
                data={formatIPData(signals.ipInfo)}
                stability={stabilityScore?.signals?.ipInfo}
                expanded={expandedSections.ipInfo}
                onToggle={() => toggleSection('ipInfo')}
              />
            )}
            <SignalCard
              title="Storage APIs"
              icon="💾"
              data={signals?.storage}
              stability={stabilityScore?.signals?.storage}
              expanded={expandedSections.storage}
              onToggle={() => toggleSection('storage')}
            />
          </div>
        )}
      </div>

      {/* Data Storage Section */}
      <div className="signals-category">
        <div
          className="signals-category-header"
          onClick={() => toggleSectionCollapse('storage')}
        >
          <span className="category-icon">🗃️</span>
          <h3>Stored Data</h3>
          <span className="category-count">
            {countStorageItems(signals)} items
          </span>
          <span className="category-toggle">
            {sectionCollapsed.storage ? '+' : '−'}
          </span>
        </div>

        {!sectionCollapsed.storage && (
          <div className="storage-sections">
            {signals?.cookies && (
              <CookiesSection
                cookies={signals.cookies}
                expanded={expandedSections.cookies}
                onToggle={() => toggleSection('cookies')}
              />
            )}

            {signals?.localStorageData && (
              <StorageSection
                title="localStorage"
                icon="📦"
                storage={signals.localStorageData}
                expanded={expandedSections.localStorage}
                onToggle={() => toggleSection('localStorage')}
              />
            )}

            {signals?.sessionStorageData && (
              <StorageSection
                title="sessionStorage"
                icon="⏱️"
                storage={signals.sessionStorageData}
                expanded={expandedSections.sessionStorage}
                onToggle={() => toggleSection('sessionStorage')}
              />
            )}

            {signals?.indexedDBData && (
              <IndexedDBSection
                data={signals.indexedDBData}
                expanded={expandedSections.indexedDB}
                onToggle={() => toggleSection('indexedDB')}
              />
            )}
          </div>
        )}
      </div>

      {/* Browsing Context Section */}
      <div className="signals-category">
        <div
          className="signals-category-header"
          onClick={() => toggleSectionCollapse('browsing')}
        >
          <span className="category-icon">🔍</span>
          <h3>Browsing Context</h3>
          <span className="category-count">
            {countBrowsingSignals(signals)} signals
          </span>
          <span className="category-toggle">
            {sectionCollapsed.browsing ? '+' : '−'}
          </span>
        </div>

        {!sectionCollapsed.browsing && (
          <div className="browsing-sections">
            {signals?.browsingContext && (
              <BrowsingContextSection
                context={signals.browsingContext}
                expanded={expandedSections.browsingContext}
                onToggle={() => toggleSection('browsingContext')}
              />
            )}

            {signals?.navigationTiming && (
              <NavigationTimingSection
                timing={signals.navigationTiming}
                expanded={expandedSections.navigationTiming}
                onToggle={() => toggleSection('navigationTiming')}
              />
            )}

            {signals?.performanceResources && (
              <PerformanceResourcesSection
                resources={signals.performanceResources}
                expanded={expandedSections.performanceResources}
                onToggle={() => toggleSection('performanceResources')}
              />
            )}
          </div>
        )}
      </div>

      {/* History Probe Section */}
      <div className="signals-category">
        <div
          className="signals-category-header"
          onClick={() => toggleSectionCollapse('history')}
        >
          <span className="category-icon">🕵️</span>
          <h3>History Probe</h3>
          <span className="category-count">
            {historyLoading ? `${historyProgress}%` : `${historySummary.probablyVisited} / ${historySummary.total} detected`}
          </span>
          <span className="category-toggle">
            {sectionCollapsed.history ? '+' : '−'}
          </span>
        </div>

        {!sectionCollapsed.history && (
          <div className="history-probe-section">
            <p className="description">
              Detects which popular sites you may have visited using browser cache timing analysis.
              Tests <strong>{historySummary.total}</strong> websites across social media, video streaming, shopping, tech, news, finance, gaming, and more.
            </p>

            {historyLoading && (
              <div className="probe-progress">
                <div className="probe-progress-bar">
                  <div className="probe-progress-fill" style={{ width: `${historyProgress}%` }}></div>
                </div>
                <span className="probe-progress-text">Probing... {historyProgress}% ({Math.round(historyProgress * historySummary.total / 100)} / {historySummary.total} sites)</span>
              </div>
            )}

            <div className="probe-controls">
              <button
                className="probe-btn"
                onClick={() => runProbe('favicon')}
                disabled={historyLoading}
              >
                {historyLoading ? 'Probing...' : historyResults.length > 0 ? 'Re-run Probe' : 'Run History Probe'}
              </button>
              {!historyLoading && historyResults.length === 0 && (
                <span className="probe-note">Auto-runs when section loads</span>
              )}
            </div>

            {historyResults.length > 0 && !historyLoading && (
              <div className="probe-results">
                <div className="probe-summary">
                  <span className="summary-label">Detected:</span>
                  <span className="summary-value">{historySummary.probablyVisited} sites</span>
                  <span className="summary-sites-count">out of {historySummary.tested} tested</span>
                </div>

                {/* Category breakdown */}
                {historySummary.byCategory && Object.keys(historySummary.byCategory).length > 0 && (
                  <div className="probe-categories">
                    <h4>By Category</h4>
                    <div className="category-badges">
                      {Object.entries(historySummary.byCategory)
                        .sort((a, b) => b[1].detected - a[1].detected)
                        .map(([category, data]) => (
                          <span
                            key={category}
                            className={`category-badge ${data.detected > 0 ? 'has-detections' : ''}`}
                          >
                            {getCategoryEmoji(category)} {category}: {data.detected}/{data.total}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                {/* Detected sites list */}
                {historySummary.probablyVisited > 0 && (
                  <div className="detected-sites">
                    <h4>Detected Sites ({historySummary.probablyVisited})</h4>
                    <div className="detected-sites-grid">
                      {historyResults
                        .filter(r => r.probablyVisited)
                        .map((result, i) => (
                          <div key={i} className="detected-site-chip">
                            <span className="site-name">{result.site}</span>
                            <span className="site-time">{result.loadTime}ms</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <details className="probe-details">
                  <summary>View all results ({historyResults.length} sites tested)</summary>
                  <div className="probe-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Site</th>
                          <th>Category</th>
                          <th>Status</th>
                          <th>Load Time</th>
                          <th>Confidence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyResults.map((result, i) => (
                          <tr key={i} className={result.probablyVisited ? 'detected' : ''}>
                            <td>{result.site}</td>
                            <td><span className="category-tag">{result.category || 'other'}</span></td>
                            <td>
                              {result.probablyVisited ? (
                                <span className="detected-badge">Detected</span>
                              ) : (
                                <span className="not-detected">—</span>
                              )}
                            </td>
                            <td>{result.loadTime}ms</td>
                            <td>
                              <span className={`confidence ${result.confidence}`}>
                                {result.confidence.replace('_', ' ')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>

                <div className="probe-disclaimer">
                  <strong>Note:</strong> Results are probabilistic and may include false positives.
                  Modern browsers implement various mitigations against this technique.
                  Cache timing can be affected by network conditions, browser extensions, and privacy settings.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function countHardwareSignals(signals) {
  let count = 0
  if (signals?.screen) count++
  if (signals?.webgl) count++
  if (signals?.webglRender) count++
  if (signals?.audio) count++
  if (signals?.mediaDevices) count++
  if (signals?.battery) count++
  return count
}

function countSoftwareSignals(signals) {
  let count = 0
  if (signals?.navigator) count++
  if (signals?.timezone) count++
  if (signals?.canvas) count++
  if (signals?.fonts) count++
  if (signals?.fontsDetailed) count++
  if (signals?.speechVoices) count++
  if (signals?.mathFingerprint) count++
  if (signals?.system) count++
  if (signals?.connection) count++
  if (signals?.webrtc) count++
  if (signals?.ipInfo) count++
  if (signals?.storage) count++
  return count
}

function countStorageItems(signals) {
  let count = 0
  if (signals?.cookies) count += signals.cookies.count || 0
  if (signals?.localStorageData) count += signals.localStorageData.count || 0
  if (signals?.sessionStorageData) count += signals.sessionStorageData.count || 0
  if (signals?.indexedDBData) count += signals.indexedDBData.totalRecords || 0
  return count
}

function countBrowsingSignals(signals) {
  let count = 0
  if (signals?.browsingContext) count++
  if (signals?.navigationTiming) count++
  if (signals?.performanceResources) count++
  return count
}

function getCategoryEmoji(category) {
  const emojis = {
    social: '👥',
    video: '🎬',
    shopping: '🛒',
    tech: '💻',
    news: '📰',
    finance: '💰',
    communication: '💬',
    gaming: '🎮',
    reference: '📚',
    travel: '✈️',
    adult: '🔞',
    ai: '🤖',
    search: '🔍',
    other: '🌐',
  }
  return emojis[category] || '🌐'
}

function formatIPData(ipInfo) {
  const formatted = {
    publicIP: ipInfo.publicIP || 'N/A',
    localIPs: ipInfo.localIPs?.length > 0 ? ipInfo.localIPs.join(', ') : 'N/A',
    isIPv6: ipInfo.isIPv6 ? 'Yes' : 'No',
  }

  if (ipInfo.country) {
    formatted.country = ipInfo.country
  }
  if (ipInfo.city) {
    formatted.city = ipInfo.city
  }
  if (ipInfo.region) {
    formatted.region = ipInfo.region
  }
  if (ipInfo.asOrg) {
    formatted.isp = ipInfo.asOrg
  }

  return formatted
}

function CookiesSection({ cookies, expanded, onToggle }) {
  const cookieList = cookies.cookies || []

  return (
    <div className="cookies-section">
      <div className="cookies-header" onClick={onToggle}>
        <span className="cookies-icon">🍪</span>
        <h3>Cookies ({cookies.count})</h3>
        <span className="cookies-expand">{expanded ? '−' : '+'}</span>
      </div>

      <div className="cookies-summary">
        <span className="cookie-stat">
          <strong>{cookies.count}</strong> cookies
        </span>
        <span className="cookie-stat">
          <strong>{cookies.totalSize}</strong> bytes
        </span>
        <span className="cookie-stat">
          Cookies {cookies.enabled ? 'enabled' : 'disabled'}
        </span>
      </div>

      {expanded && cookieList.length > 0 && (
        <div className="cookies-table-wrapper">
          <table className="cookies-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Value</th>
                <th>Type</th>
                <th>Size</th>
              </tr>
            </thead>
            <tbody>
              {cookieList.map((cookie, i) => (
                <tr key={i}>
                  <td className="cookie-name">{cookie.name}</td>
                  <td className="cookie-value">
                    <code>{truncateValue(cookie.value, 50)}</code>
                    {cookie.decodedValue && (
                      <div className="cookie-decoded">
                        Decoded: {truncateValue(cookie.decodedValue, 50)}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`cookie-type ${cookie.type.split(':')[0]}`}>
                      {cookie.type}
                    </span>
                  </td>
                  <td className="cookie-size">{cookie.size}B</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {expanded && cookieList.length === 0 && (
        <div className="no-cookies">No cookies found for this domain</div>
      )}
    </div>
  )
}

function truncateValue(value, maxLength) {
  if (!value) return ''
  if (value.length <= maxLength) return value
  return value.substring(0, maxLength) + '...'
}

function StorageSection({ title, icon, storage, expanded, onToggle }) {
  const items = storage.items || []

  return (
    <div className="storage-section">
      <div className="storage-header" onClick={onToggle}>
        <span className="storage-icon">{icon}</span>
        <h3>{title} ({storage.count})</h3>
        <span className="storage-expand">{expanded ? '−' : '+'}</span>
      </div>

      <div className="storage-summary">
        <span className="storage-stat">
          <strong>{storage.count}</strong> items
        </span>
        <span className="storage-stat">
          <strong>{storage.totalSizeKB}</strong> KB
        </span>
        <span className="storage-stat">
          {storage.supported ? 'Available' : 'Not supported'}
        </span>
      </div>

      {expanded && items.length > 0 && (
        <div className="storage-table-wrapper">
          <table className="storage-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Value</th>
                <th>Type</th>
                <th>Size</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td className="storage-key">{item.key}</td>
                  <td className="storage-value">
                    {item.isJSON ? (
                      <details className="json-details">
                        <summary>
                          <code>{truncateValue(item.value, 40)}</code>
                        </summary>
                        <pre className="json-preview">
                          {JSON.stringify(item.parsed, null, 2)}
                        </pre>
                      </details>
                    ) : (
                      <code>{truncateValue(item.value, 60)}</code>
                    )}
                  </td>
                  <td>
                    <span className={`storage-type ${item.type.split(':')[0]}`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="storage-size">
                    {item.size > 1024
                      ? `${(item.size / 1024).toFixed(1)}KB`
                      : `${item.size}B`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {expanded && items.length === 0 && (
        <div className="no-storage">No items in {title}</div>
      )}
    </div>
  )
}

function IndexedDBSection({ data, expanded, onToggle }) {
  const databases = data.databases || []

  return (
    <div className="indexeddb-section">
      <div className="indexeddb-header" onClick={onToggle}>
        <span className="indexeddb-icon">🗄️</span>
        <h3>IndexedDB ({data.count} databases)</h3>
        <span className="indexeddb-expand">{expanded ? '−' : '+'}</span>
      </div>

      <div className="indexeddb-summary">
        <span className="indexeddb-stat">
          <strong>{data.count}</strong> databases
        </span>
        <span className="indexeddb-stat">
          <strong>{data.totalRecords}</strong> records
        </span>
        <span className="indexeddb-stat">
          <strong>{data.totalSizeKB}</strong> KB (estimated)
        </span>
      </div>

      {expanded && databases.length > 0 && (
        <div className="indexeddb-databases">
          {databases.map((db, i) => (
            <DatabaseCard key={i} database={db} />
          ))}
        </div>
      )}

      {expanded && databases.length === 0 && (
        <div className="no-indexeddb">No IndexedDB databases found</div>
      )}
    </div>
  )
}

function DatabaseCard({ database }) {
  return (
    <div className="database-card">
      <div className="database-header">
        <div className="database-info">
          <span className="database-name">{database.name}</span>
          <span className={`database-type ${database.type}`}>{database.type}</span>
        </div>
        <div className="database-meta">
          <span>v{database.version}</span>
          <span>{database.storeCount} stores</span>
          <span>{database.totalRecords} records</span>
          <span>
            {database.estimatedSize > 1024
              ? `${(database.estimatedSize / 1024).toFixed(1)}KB`
              : `${database.estimatedSize}B`}
          </span>
        </div>
      </div>

      {database.stores && database.stores.length > 0 && (
        <div className="object-stores">
          {database.stores.map((store, j) => (
            <div key={j} className="object-store">
              <div className="store-header">
                <span className="store-name">{store.name}</span>
                <span className="store-count">{store.count} records</span>
              </div>
              <div className="store-details">
                {store.keyPath && (
                  <span className="store-detail">keyPath: {store.keyPath}</span>
                )}
                {store.autoIncrement && (
                  <span className="store-detail">autoIncrement</span>
                )}
                {store.indexes && store.indexes.length > 0 && (
                  <span className="store-detail">
                    indexes: {store.indexes.join(', ')}
                  </span>
                )}
              </div>
              {store.sampleRecords && store.sampleRecords.length > 0 && (
                <details className="store-samples">
                  <summary>Sample records ({store.sampleRecords.length})</summary>
                  <div className="sample-records">
                    {store.sampleRecords.map((record, k) => (
                      <code key={k} className="sample-record">
                        {record.preview}
                      </code>
                    ))}
                  </div>
                </details>
              )}
              {store.note && (
                <div className="store-note">{store.note}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {database.note && (
        <div className="database-note">{database.note}</div>
      )}
    </div>
  )
}

function BrowsingContextSection({ context, expanded, onToggle }) {
  return (
    <div className="browsing-context-section">
      <div className="browsing-header" onClick={onToggle}>
        <span className="browsing-icon">🔗</span>
        <h3>Browsing Context</h3>
        <span className="browsing-expand">{expanded ? '−' : '+'}</span>
      </div>

      <div className="browsing-summary">
        <span className="browsing-stat">
          <strong>{context.historyLength}</strong> history entries
        </span>
        <span className="browsing-stat">
          Type: <strong>{context.navigationType || 'unknown'}</strong>
        </span>
        {context.referrer && (
          <span className="browsing-stat">
            From: <strong>{context.referrerDomain}</strong>
          </span>
        )}
      </div>

      {expanded && (
        <div className="browsing-details">
          <div className="browsing-group">
            <h4>Navigation</h4>
            <div className="browsing-row">
              <span className="browsing-label">History Length</span>
              <span className="browsing-value">{context.historyLength}</span>
            </div>
            <div className="browsing-row">
              <span className="browsing-label">Navigation Type</span>
              <span className="browsing-value">{context.navigationType || 'N/A'}</span>
            </div>
            <div className="browsing-row">
              <span className="browsing-label">Redirect Count</span>
              <span className="browsing-value">{context.redirectCount}</span>
            </div>
          </div>

          <div className="browsing-group">
            <h4>Referrer</h4>
            <div className="browsing-row">
              <span className="browsing-label">Referrer URL</span>
              <span className="browsing-value url">{context.referrer || 'Direct / None'}</span>
            </div>
            {context.referrerDomain && (
              <div className="browsing-row">
                <span className="browsing-label">Referrer Domain</span>
                <span className="browsing-value">{context.referrerDomain}</span>
              </div>
            )}
            <div className="browsing-row">
              <span className="browsing-label">External Referrer</span>
              <span className="browsing-value">{context.isExternalReferrer ? 'Yes' : 'No'}</span>
            </div>
          </div>

          <div className="browsing-group">
            <h4>Current Page</h4>
            <div className="browsing-row">
              <span className="browsing-label">URL</span>
              <span className="browsing-value url">{context.currentURL}</span>
            </div>
            <div className="browsing-row">
              <span className="browsing-label">Path</span>
              <span className="browsing-value">{context.currentPath}</span>
            </div>
            {context.currentSearch && (
              <div className="browsing-row">
                <span className="browsing-label">Query String</span>
                <span className="browsing-value">{context.currentSearch}</span>
              </div>
            )}
            {context.currentHash && (
              <div className="browsing-row">
                <span className="browsing-label">Hash</span>
                <span className="browsing-value">{context.currentHash}</span>
              </div>
            )}
          </div>

          <div className="browsing-group">
            <h4>Document State</h4>
            <div className="browsing-row">
              <span className="browsing-label">Ready State</span>
              <span className="browsing-value">{context.documentState}</span>
            </div>
            <div className="browsing-row">
              <span className="browsing-label">Visibility</span>
              <span className="browsing-value">{context.visibilityState}</span>
            </div>
            <div className="browsing-row">
              <span className="browsing-label">In Iframe</span>
              <span className="browsing-value">{context.isInIframe ? 'Yes' : 'No'}</span>
            </div>
            <div className="browsing-row">
              <span className="browsing-label">Has Opener</span>
              <span className="browsing-value">{context.hasOpener ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NavigationTimingSection({ timing, expanded, onToggle }) {
  if (!timing.supported) {
    return null
  }

  return (
    <div className="navigation-timing-section">
      <div className="timing-header" onClick={onToggle}>
        <span className="timing-icon">⏱️</span>
        <h3>Navigation Timing</h3>
        <span className="timing-expand">{expanded ? '−' : '+'}</span>
      </div>

      <div className="timing-summary">
        <span className="timing-stat">
          Load: <strong>{timing.timing.loadComplete}ms</strong>
        </span>
        <span className="timing-stat">
          TTFB: <strong>{timing.timing.ttfb}ms</strong>
        </span>
        <span className="timing-stat">
          Protocol: <strong>{timing.protocol}</strong>
        </span>
        {timing.fromCache && (
          <span className="timing-stat cached">From Cache</span>
        )}
      </div>

      {expanded && (
        <div className="timing-details">
          <div className="timing-group">
            <h4>Connection</h4>
            <div className="timing-row">
              <span className="timing-label">DNS Lookup</span>
              <span className="timing-value">{timing.timing.dnsLookup}ms</span>
            </div>
            <div className="timing-row">
              <span className="timing-label">TCP Connect</span>
              <span className="timing-value">{timing.timing.tcpConnect}ms</span>
            </div>
            {timing.timing.sslHandshake > 0 && (
              <div className="timing-row">
                <span className="timing-label">SSL Handshake</span>
                <span className="timing-value">{timing.timing.sslHandshake}ms</span>
              </div>
            )}
          </div>

          <div className="timing-group">
            <h4>Request/Response</h4>
            <div className="timing-row">
              <span className="timing-label">Time to First Byte</span>
              <span className="timing-value">{timing.timing.ttfb}ms</span>
            </div>
            <div className="timing-row">
              <span className="timing-label">Response Time</span>
              <span className="timing-value">{timing.timing.responseTime}ms</span>
            </div>
          </div>

          <div className="timing-group">
            <h4>DOM Processing</h4>
            <div className="timing-row">
              <span className="timing-label">DOM Interactive</span>
              <span className="timing-value">{timing.timing.domInteractive}ms</span>
            </div>
            <div className="timing-row">
              <span className="timing-label">DOM Complete</span>
              <span className="timing-value">{timing.timing.domComplete}ms</span>
            </div>
            <div className="timing-row">
              <span className="timing-label">Total Load Time</span>
              <span className="timing-value highlight">{timing.timing.loadComplete}ms</span>
            </div>
          </div>

          <div className="timing-group">
            <h4>Transfer</h4>
            <div className="timing-row">
              <span className="timing-label">Transfer Size</span>
              <span className="timing-value">{(timing.transfer.transferSize / 1024).toFixed(1)} KB</span>
            </div>
            <div className="timing-row">
              <span className="timing-label">Decoded Size</span>
              <span className="timing-value">{(timing.transfer.decodedBodySize / 1024).toFixed(1)} KB</span>
            </div>
            <div className="timing-row">
              <span className="timing-label">From Cache</span>
              <span className="timing-value">{timing.fromCache ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PerformanceResourcesSection({ resources, expanded, onToggle }) {
  if (!resources.supported) {
    return null
  }

  return (
    <div className="performance-resources-section">
      <div className="resources-header" onClick={onToggle}>
        <span className="resources-icon">📊</span>
        <h3>Page Resources ({resources.totalCount})</h3>
        <span className="resources-expand">{expanded ? '−' : '+'}</span>
      </div>

      <div className="resources-summary">
        <span className="resources-stat">
          <strong>{resources.totalCount}</strong> resources
        </span>
        <span className="resources-stat">
          <strong>{resources.totalTransferSizeKB}</strong> KB transferred
        </span>
        <span className="resources-stat">
          <strong>{resources.externalDomainCount}</strong> external domains
        </span>
      </div>

      {expanded && (
        <div className="resources-details">
          <div className="resources-group">
            <h4>By Type</h4>
            <div className="resource-types">
              {Object.entries(resources.byType).map(([type, count]) => (
                <div key={type} className="resource-type-badge">
                  <span className="type-name">{type}</span>
                  <span className="type-count">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {resources.externalDomains.length > 0 && (
            <div className="resources-group">
              <h4>External Domains</h4>
              <div className="external-domains">
                {resources.externalDomains.map((domain, i) => (
                  <span key={i} className="external-domain">{domain}</span>
                ))}
              </div>
            </div>
          )}

          <div className="resources-group">
            <h4>Slowest Resources</h4>
            <div className="slowest-resources">
              {resources.slowestResources.map((r, i) => (
                <div key={i} className="resource-row">
                  <span className="resource-duration">{r.duration}ms</span>
                  <span className="resource-type-tag">{r.type}</span>
                  <span className="resource-name" title={r.name}>
                    {r.name.length > 60 ? '...' + r.name.slice(-50) : r.name}
                  </span>
                  {r.fromCache && <span className="cache-badge">cached</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
