import { useState, useCallback, useRef, useEffect } from 'react'

const API_BASE = '/api'
const STORAGE_KEY = 'fingerprint_history'
const MAX_VISITS = 10

function getPageInfo() {
  return {
    url: window.location.href,
    title: document.title,
    referrer: document.referrer,
    path: window.location.pathname,
  }
}

export function useVisitorHistory(currentFingerprint, currentComponents, currentSignals) {
  const processedRef = useRef(false)
  const [state, setState] = useState({
    visitor: null,
    comparison: null,
    stabilityScore: null,
    visitedPages: [],
    isReturningVisitor: false,
    visitCount: 0,
    loading: true,
    error: null,
    useLocalStorage: false,
  })

  useEffect(() => {
    if (!currentFingerprint || !currentComponents || processedRef.current) {
      return
    }

    const pageInfo = getPageInfo()

    async function recordVisit() {
      try {
        const response = await fetch(`${API_BASE}/visit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fingerprint: currentFingerprint,
            components: currentComponents,
            signals: currentSignals,
            page: pageInfo,
          }),
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()
        processedRef.current = true

        setState({
          visitor: data.visitor,
          comparison: data.comparison,
          stabilityScore: data.stabilityScore,
          visitedPages: data.visitedPages || [],
          isReturningVisitor: data.isReturning,
          visitCount: data.visitor?.visitCount || 1,
          loading: false,
          error: null,
          useLocalStorage: false,
        })
      } catch (error) {
        console.warn('API unavailable, falling back to localStorage:', error.message)
        fallbackToLocalStorage(pageInfo)
      }
    }

    function fallbackToLocalStorage(page) {
      const timestamp = Date.now()
      const stored = localStorage.getItem(STORAGE_KEY)
      const visitHistory = stored ? JSON.parse(stored) : { visits: [], pages: {} }

      // Ensure pages object exists (for old data)
      if (!visitHistory.pages) {
        visitHistory.pages = {}
      }

      const currentVisit = {
        timestamp,
        fingerprint: currentFingerprint,
        components: serializeComponents(currentComponents),
        signals: currentSignals,
        page,
      }

      let comparison = null
      let stabilityScore = null

      if (visitHistory.visits.length > 0) {
        const lastVisit = visitHistory.visits[visitHistory.visits.length - 1]
        comparison = compareVisits(lastVisit, currentVisit)
        stabilityScore = calculateStability(visitHistory.visits, currentVisit)
      }

      // Track page
      const pageKey = page.url
      if (visitHistory.pages[pageKey]) {
        visitHistory.pages[pageKey].lastVisitAt = timestamp
        visitHistory.pages[pageKey].visitCount++
      } else {
        visitHistory.pages[pageKey] = {
          url: page.url,
          title: page.title,
          firstVisitAt: timestamp,
          lastVisitAt: timestamp,
          visitCount: 1,
        }
      }

      visitHistory.visits.push(currentVisit)
      if (visitHistory.visits.length > MAX_VISITS) {
        visitHistory.visits = visitHistory.visits.slice(-MAX_VISITS)
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(visitHistory))
      processedRef.current = true

      // Convert pages object to array sorted by last visit
      const visitedPages = Object.values(visitHistory.pages)
        .sort((a, b) => b.lastVisitAt - a.lastVisitAt)

      setState({
        visitor: {
          id: 'local',
          fingerprint: currentFingerprint,
          firstSeenAt: visitHistory.visits[0].timestamp,
          lastSeenAt: timestamp,
          visitCount: visitHistory.visits.length,
        },
        comparison,
        stabilityScore,
        visitedPages,
        isReturningVisitor: visitHistory.visits.length > 1,
        visitCount: visitHistory.visits.length,
        loading: false,
        error: null,
        useLocalStorage: true,
      })
    }

    recordVisit()
  }, [currentFingerprint, currentComponents, currentSignals])

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    processedRef.current = false
    setState({
      visitor: null,
      comparison: null,
      stabilityScore: null,
      visitedPages: [],
      isReturningVisitor: false,
      visitCount: 0,
      loading: false,
      error: null,
      useLocalStorage: false,
    })
  }, [])

  return { ...state, clearHistory }
}

export function useGlobalStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch(`${API_BASE}/stats`)
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }
        const data = await response.json()
        setStats(data)
        setLoading(false)
      } catch (err) {
        console.warn('Stats API unavailable:', err.message)
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const history = JSON.parse(stored)
          const pages = history.pages ? Object.values(history.pages) : []
          setStats({
            totalVisitors: 1,
            totalVisits: history.visits.length,
            returningVisitors: history.visits.length > 1 ? 1 : 0,
            returningRate: history.visits.length > 1 ? 100 : 0,
            visitsLast24h: history.visits.filter(
              v => v.timestamp > Date.now() - 24 * 60 * 60 * 1000
            ).length,
            avgVisitsPerVisitor: history.visits.length,
            totalPages: pages.length,
            latestVisits: history.visits.slice(-10).reverse().map(v => ({
              fingerprint: v.fingerprint.slice(0, 8) + '...',
              timestamp: v.timestamp,
              visitCount: history.visits.length,
              page: v.page?.path || v.page?.url || 'Unknown',
            })),
            isLocal: true,
          })
        }
        setError(null)
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return { stats, loading, error }
}

function serializeComponents(components) {
  const serialized = {}
  for (const [key, data] of Object.entries(components)) {
    serialized[key] = {
      value: data.value,
      duration: data.duration,
    }
  }
  return serialized
}

function compareVisits(previous, current) {
  const changes = {
    fingerprintMatch: previous.fingerprint === current.fingerprint,
    componentChanges: [],
    signalChanges: [],
    timeSinceLastVisit: current.timestamp - previous.timestamp,
  }

  for (const key of Object.keys(current.components)) {
    const prevValue = previous.components[key]?.value
    const currValue = current.components[key]?.value

    if (JSON.stringify(prevValue) !== JSON.stringify(currValue)) {
      changes.componentChanges.push({
        name: key,
        previous: formatValue(prevValue),
        current: formatValue(currValue),
      })
    }
  }

  if (previous.signals && current.signals) {
    for (const category of Object.keys(current.signals)) {
      const prevCat = previous.signals[category]
      const currCat = current.signals[category]

      if (!prevCat) continue

      for (const key of Object.keys(currCat)) {
        const prevValue = prevCat[key]
        const currValue = currCat[key]

        if (JSON.stringify(prevValue) !== JSON.stringify(currValue)) {
          changes.signalChanges.push({
            category,
            name: key,
            previous: formatValue(prevValue),
            current: formatValue(currValue),
          })
        }
      }
    }
  }

  return changes
}

function calculateStability(visits, currentVisit) {
  if (visits.length === 0) {
    return { overall: 100, components: {}, signals: {} }
  }

  const allVisits = [...visits, currentVisit]
  const componentStability = {}
  const signalStability = {}

  const componentKeys = Object.keys(currentVisit.components)
  for (const key of componentKeys) {
    const values = allVisits.map(v => JSON.stringify(v.components[key]?.value))
    const uniqueValues = new Set(values)
    componentStability[key] = {
      stable: uniqueValues.size === 1,
      consistency: ((allVisits.length - uniqueValues.size + 1) / allVisits.length) * 100,
      variations: uniqueValues.size,
    }
  }

  if (currentVisit.signals) {
    for (const category of Object.keys(currentVisit.signals)) {
      signalStability[category] = {}
      for (const key of Object.keys(currentVisit.signals[category])) {
        const values = allVisits
          .filter(v => v.signals && v.signals[category])
          .map(v => JSON.stringify(v.signals[category][key]))
        const uniqueValues = new Set(values)
        signalStability[category][key] = {
          stable: uniqueValues.size === 1,
          consistency: values.length > 0
            ? ((values.length - uniqueValues.size + 1) / values.length) * 100
            : 100,
          variations: uniqueValues.size,
        }
      }
    }
  }

  const componentScores = Object.values(componentStability).map(c => c.consistency)
  const overallComponent = componentScores.reduce((a, b) => a + b, 0) / componentScores.length

  const fingerprints = allVisits.map(v => v.fingerprint)
  const uniqueFingerprints = new Set(fingerprints)
  const fingerprintStability = ((allVisits.length - uniqueFingerprints.size + 1) / allVisits.length) * 100

  return {
    overall: Math.round((overallComponent + fingerprintStability) / 2),
    fingerprintConsistency: Math.round(fingerprintStability),
    uniqueFingerprints: uniqueFingerprints.size,
    components: componentStability,
    signals: signalStability,
    totalVisits: allVisits.length,
  }
}

function formatValue(value) {
  if (value === undefined || value === null) return 'N/A'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return value.toLocaleString()
  if (Array.isArray(value)) {
    if (value.length === 0) return '(empty)'
    if (value.length <= 3) return value.join(', ')
    return `${value.slice(0, 3).join(', ')} (+${value.length - 3} more)`
  }
  if (typeof value === 'object') {
    const str = JSON.stringify(value)
    return str.length > 40 ? str.slice(0, 40) + '...' : str
  }
  const str = String(value)
  return str.length > 50 ? str.slice(0, 50) + '...' : str
}
