import { SignalCard } from '../components'

export function SignalsTab({ signals, signalsLoading, stabilityScore, expandedSections, toggleSection }) {
  return (
    <section className="signals-section">
      <h2>Collected Signals</h2>

      {signalsLoading ? (
        <div className="loading">Collecting browser signals...</div>
      ) : (
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
            title="WebGL"
            icon="🎮"
            data={signals?.webgl}
            stability={stabilityScore?.signals?.webgl}
            expanded={expandedSections.webgl}
            onToggle={() => toggleSection('webgl')}
          />
          <SignalCard
            title="Audio"
            icon="🔊"
            data={signals?.audio}
            stability={stabilityScore?.signals?.audio}
            expanded={expandedSections.audio}
            onToggle={() => toggleSection('audio')}
          />
          <SignalCard
            title="Fonts"
            icon="✏️"
            data={signals?.fonts}
            stability={stabilityScore?.signals?.fonts}
            expanded={expandedSections.fonts}
            onToggle={() => toggleSection('fonts')}
          />
          <SignalCard
            title="Storage"
            icon="💾"
            data={signals?.storage}
            stability={stabilityScore?.signals?.storage}
            expanded={expandedSections.storage}
            onToggle={() => toggleSection('storage')}
          />
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
        </div>
      )}

      {/* Cookies Section - Full Width */}
      {signals?.cookies && (
        <CookiesSection cookies={signals.cookies} expanded={expandedSections.cookies} onToggle={() => toggleSection('cookies')} />
      )}

      {/* localStorage Section */}
      {signals?.localStorageData && (
        <StorageSection
          title="localStorage"
          icon="📦"
          storage={signals.localStorageData}
          expanded={expandedSections.localStorage}
          onToggle={() => toggleSection('localStorage')}
        />
      )}

      {/* sessionStorage Section */}
      {signals?.sessionStorageData && (
        <StorageSection
          title="sessionStorage"
          icon="⏱️"
          storage={signals.sessionStorageData}
          expanded={expandedSections.sessionStorage}
          onToggle={() => toggleSection('sessionStorage')}
        />
      )}
    </section>
  )
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
