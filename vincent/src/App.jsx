import { useState, useEffect } from 'react'
import { useFingerprint, useCustomSignals } from './hooks/useFingerprint'
import { useVisitorHistory, useGlobalStats } from './hooks/useVisitorHistory'
import { useOpenPages } from './hooks/useOpenPages'
import { usePageTracking } from './hooks/usePageTracking'
import {
  OverviewTab,
  SignalsTab,
  StabilityTab,
  ChangesTab,
  PagesTab,
  GlobalStatsTab,
  FingerprintJSTab,
} from './pages'
import './App.css'

function App() {
  const { fingerprint, components, loading: fpLoading, error: fpError } = useFingerprint()
  const { signals, deviceFingerprint, loading: signalsLoading } = useCustomSignals()
  const {
    visitor,
    comparison,
    stabilityScore,
    isReturningVisitor,
    visitCount,
    loading: historyLoading,
    error: historyError,
    useLocalStorage,
    clearHistory,
  } = useVisitorHistory(fingerprint, components, signals)
  const { stats, loading: statsLoading } = useGlobalStats()
  const { openPages, currentTabId } = useOpenPages()
  const { pages: trackedPages, loading: pagesLoading, useLocalStorage: pagesLocal } = usePageTracking(fingerprint)
  const [expandedSections, setExpandedSections] = useState({
    // Storage sections expanded by default to show all data
    cookies: true,
    localStorage: true,
    sessionStorage: true,
    indexedDB: true,
  })
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('fingerprint-active-tab')
    return saved || 'overview'
  })
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('fingerprint-user-name') || ''
  })
  const [namePromptDismissed, setNamePromptDismissed] = useState(false)

  const showNamePrompt = !historyLoading && !fpLoading && !userName && !isReturningVisitor && !namePromptDismissed

  const saveUserName = (name) => {
    const trimmedName = name.trim()
    if (trimmedName) {
      localStorage.setItem('fingerprint-user-name', trimmedName)
      setUserName(trimmedName)
    }
    setNamePromptDismissed(true)
  }

  const dismissNamePrompt = () => {
    setNamePromptDismissed(true)
  }

  useEffect(() => {
    localStorage.setItem('fingerprint-active-tab', activeTab)
  }, [activeTab])

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  const isLoading = fpLoading || signalsLoading || historyLoading

  return (
    <div className="app">
      <header className="header">
        <h1>Browser Fingerprint</h1>
        <p className="subtitle">by Vincent</p>
      </header>

      <main className="main">
        {historyError && (
          <div className="error-banner">
            <span>API Error: {historyError}</span>
            <span className="error-note">Data is being collected locally</span>
          </div>
        )}

        {showNamePrompt && (
          <NamePrompt onSave={saveUserName} onSkip={dismissNamePrompt} />
        )}

        {!isLoading && !historyError && (
          <VisitorBanner
            isReturningVisitor={isReturningVisitor}
            visitCount={visitCount}
            comparison={comparison}
            useLocalStorage={useLocalStorage}
            userName={userName}
          />
        )}

        <TabNavigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          stabilityScore={stabilityScore}
          comparison={comparison}
          openPages={openPages}
          trackedPages={trackedPages}
        />

        {activeTab === 'overview' && (
          <OverviewTab
            fingerprint={fingerprint}
            deviceFingerprint={deviceFingerprint}
            fpLoading={fpLoading}
            fpError={fpError}
            signalsLoading={signalsLoading}
            visitor={visitor}
            stabilityScore={stabilityScore}
            visitCount={visitCount}
            copyToClipboard={copyToClipboard}
          />
        )}

        {activeTab === 'fingerprintjs' && (
          <FingerprintJSTab
            fingerprint={fingerprint}
            fpLoading={fpLoading}
            fpError={fpError}
            components={components}
            stabilityScore={stabilityScore}
            copyToClipboard={copyToClipboard}
          />
        )}

        {activeTab === 'signals' && (
          <SignalsTab
            signals={signals}
            signalsLoading={signalsLoading}
            stabilityScore={stabilityScore}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />
        )}

        {activeTab === 'stability' && (
          <StabilityTab stabilityScore={stabilityScore} />
        )}

        {activeTab === 'changes' && (
          <ChangesTab comparison={comparison} />
        )}

        {activeTab === 'pages' && (
          <PagesTab
            trackedPages={trackedPages}
            pagesLoading={pagesLoading}
            pagesLocal={pagesLocal}
            openPages={openPages}
            currentTabId={currentTabId}
          />
        )}

        {activeTab === 'global' && (
          <GlobalStatsTab stats={stats} statsLoading={statsLoading} />
        )}

        {visitCount > 0 && (
          <div className="clear-history">
            <button onClick={clearHistory} className="clear-btn">
              Clear Local State
            </button>
            <span className="clear-note">Database records are preserved for analytics</span>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Fingerprint Development Session - February 2026</p>
        <p className="note">
          {useLocalStorage
            ? 'Using localStorage (API unavailable in dev mode)'
            : 'Data stored in Cloudflare D1 SQLite database'}
        </p>
      </footer>
    </div>
  )
}

function VisitorBanner({ isReturningVisitor, visitCount, comparison, useLocalStorage, userName }) {
  return (
    <div className={`visitor-banner ${isReturningVisitor ? 'returning' : 'new'}`}>
      {isReturningVisitor ? (
        <>
          <span className="visitor-icon">👋</span>
          <div className="visitor-info">
            <strong>Welcome back{userName ? `, ${userName}` : ''}!</strong>
            <span>Visit #{visitCount} • Fingerprint {comparison?.fingerprintMatch ? 'matches' : 'changed'}</span>
          </div>
          {comparison?.fingerprintMatch ? (
            <span className="match-badge success">MATCH</span>
          ) : (
            <span className="match-badge warning">CHANGED</span>
          )}
        </>
      ) : (
        <>
          <span className="visitor-icon">✨</span>
          <div className="visitor-info">
            <strong>{userName ? `Hello, ${userName}!` : 'First visit detected'}</strong>
            <span>Your fingerprint has been stored {useLocalStorage ? 'locally' : 'in the database'}</span>
          </div>
          <span className="match-badge new">NEW</span>
        </>
      )}
    </div>
  )
}

function NamePrompt({ onSave, onSkip }) {
  const [name, setName] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(name)
  }

  return (
    <div className="name-prompt-overlay">
      <div className="name-prompt">
        <h3>Welcome!</h3>
        <p>What should we call you?</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            autoFocus
          />
          <div className="name-prompt-buttons">
            <button type="submit" className="save-btn" disabled={!name.trim()}>
              Save
            </button>
            <button type="button" className="skip-btn" onClick={onSkip}>
              Skip
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TabNavigation({ activeTab, setActiveTab, stabilityScore, comparison, openPages, trackedPages }) {
  const openCount = openPages?.length || 0
  const trackedCount = trackedPages?.length || 0

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'fingerprintjs', label: 'FingerprintJS' },
    { id: 'signals', label: 'Signals' },
    { id: 'stability', label: 'Stability', disabled: !stabilityScore },
    { id: 'changes', label: 'Changes', disabled: !comparison },
    { id: 'pages', label: `Pages (${trackedCount}, ${openCount} open)` },
    { id: 'global', label: 'Global Stats' },
  ]

  return (
    <div className="tab-nav">
      {tabs.map(({ id, label, disabled }) => (
        <button
          key={id}
          className={`tab-btn ${activeTab === id ? 'active' : ''}`}
          onClick={() => setActiveTab(id)}
          disabled={disabled}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export default App
