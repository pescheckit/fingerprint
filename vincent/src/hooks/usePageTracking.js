import { useState, useEffect, useCallback, useRef } from 'react'

const API_BASE = '/api'
const STORAGE_KEY = 'fingerprint_visited_pages'

export function usePageTracking(fingerprint) {
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [useLocalStorage, setUseLocalStorage] = useState(false)
  const trackedRef = useRef(false)

  // Load from localStorage
  const loadLocalPages = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const pagesData = JSON.parse(stored)
      const pagesList = Object.values(pagesData)
        .sort((a, b) => b.lastVisitAt - a.lastVisitAt)
      setPages(pagesList)
    }
    setUseLocalStorage(true)
    setLoading(false)
  }, [])

  // Local storage fallback for tracking
  const trackPageLocally = useCallback((pageInfo) => {
    const timestamp = Date.now()
    const stored = localStorage.getItem(STORAGE_KEY)
    const pagesData = stored ? JSON.parse(stored) : {}

    const pageKey = pageInfo.url
    if (pagesData[pageKey]) {
      pagesData[pageKey].lastVisitAt = timestamp
      pagesData[pageKey].visitCount++
      pagesData[pageKey].title = pageInfo.title || pagesData[pageKey].title
    } else {
      pagesData[pageKey] = {
        url: pageInfo.url,
        path: pageInfo.path,
        title: pageInfo.title,
        firstVisitAt: timestamp,
        lastVisitAt: timestamp,
        visitCount: 1,
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(pagesData))
    trackedRef.current = true

    const pagesList = Object.values(pagesData)
      .sort((a, b) => b.lastVisitAt - a.lastVisitAt)

    setPages(pagesList)
    setUseLocalStorage(true)
    setLoading(false)
  }, [])

  // Track current page visit
  const trackPage = useCallback(async () => {
    if (!fingerprint || trackedRef.current) return

    const pageInfo = {
      url: window.location.href,
      path: window.location.pathname,
      title: document.title,
    }

    try {
      const response = await fetch(`${API_BASE}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint, page: pageInfo }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      trackedRef.current = true
      setPages(data.pages || [])
      setUseLocalStorage(false)
      setLoading(false)
    } catch (error) {
      console.warn('Pages API unavailable, using localStorage:', error.message)
      trackPageLocally(pageInfo)
    }
  }, [fingerprint, trackPageLocally])

  // Fetch existing pages
  const fetchPages = useCallback(async () => {
    if (!fingerprint) return

    try {
      const response = await fetch(`${API_BASE}/pages?fingerprint=${encodeURIComponent(fingerprint)}`)

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      setPages(data.pages || [])
      setUseLocalStorage(false)
    } catch (error) {
      console.warn('Pages fetch unavailable, using localStorage:', error.message)
      loadLocalPages()
    }
  }, [fingerprint, loadLocalPages])

  // Clear local pages
  const clearPages = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setPages([])
  }, [])

  // Track page on mount
  useEffect(() => {
    if (fingerprint && !trackedRef.current) {
      trackPage()
    }
  }, [fingerprint, trackPage])

  // Listen for visibility changes to track page focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && fingerprint) {
        // Refresh pages list when tab becomes visible
        fetchPages()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [fingerprint, fetchPages])

  return {
    pages,
    loading,
    useLocalStorage,
    clearPages,
    refreshPages: fetchPages,
  }
}
