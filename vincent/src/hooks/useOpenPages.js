import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import PageTrackerWorker from '../workers/pageTracker.worker.js?worker'

const CHANNEL_NAME = 'fingerprint_open_pages'
const STORAGE_KEY = 'fingerprint_open_tabs'
const STALE_THRESHOLD = 10000

function generateTabId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function getPageInfo() {
  return {
    url: window.location.href,
    path: window.location.pathname,
    title: document.title,
  }
}

export function useOpenPages() {
  const tabId = useMemo(() => generateTabId(), [])
  const workerRef = useRef(null)
  const channelRef = useRef(null)
  const [openPages, setOpenPages] = useState([])

  // Storage operations (must be in main thread)
  const registerTab = useCallback((pageInfo) => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const tabs = stored ? JSON.parse(stored) : {}

    tabs[tabId] = {
      ...pageInfo,
      tabId,
      openedAt: Date.now(),
      lastHeartbeat: Date.now(),
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs))
    return tabs
  }, [tabId])

  const unregisterTab = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const tabs = JSON.parse(stored)
      delete tabs[tabId]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs))
    }
  }, [tabId])

  const sendHeartbeat = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const tabs = JSON.parse(stored)
      if (tabs[tabId]) {
        tabs[tabId].lastHeartbeat = Date.now()
        tabs[tabId].title = document.title
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs))
      }
    }
  }, [tabId])

  const cleanupAndGetPages = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      setOpenPages([])
      return
    }

    const tabs = JSON.parse(stored)
    const now = Date.now()
    let changed = false

    // Remove stale tabs
    for (const id of Object.keys(tabs)) {
      if (now - tabs[id].lastHeartbeat > STALE_THRESHOLD) {
        delete tabs[id]
        changed = true
      }
    }

    if (changed) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs))
    }

    const activePages = Object.values(tabs)
      .filter(tab => now - tab.lastHeartbeat < STALE_THRESHOLD)
      .sort((a, b) => b.openedAt - a.openedAt)

    setOpenPages(activePages)
  }, [])

  const broadcast = useCallback((type) => {
    if (channelRef.current) {
      channelRef.current.postMessage({ type, tabId })
    }
  }, [tabId])

  useEffect(() => {
    const pageInfo = getPageInfo()

    // Initialize worker
    try {
      workerRef.current = new PageTrackerWorker()
      workerRef.current.onmessage = (e) => {
        if (e.data.type === 'tick') {
          sendHeartbeat()
          cleanupAndGetPages()
        }
      }
    } catch {
      console.warn('Worker not supported, falling back to main thread intervals')
    }

    // Initialize BroadcastChannel
    try {
      channelRef.current = new BroadcastChannel(CHANNEL_NAME)
      channelRef.current.onmessage = () => {
        cleanupAndGetPages()
      }
    } catch {
      console.warn('BroadcastChannel not supported')
    }

    // Storage event listener for cross-tab sync
    function handleStorageChange(e) {
      if (e.key === STORAGE_KEY) {
        cleanupAndGetPages()
      }
    }

    // Visibility change handler
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        sendHeartbeat()
        cleanupAndGetPages()
        broadcast('focus')
      }
    }

    // Unload handler
    function handleUnload() {
      unregisterTab()
      broadcast('close')
      if (workerRef.current) {
        workerRef.current.postMessage({ type: 'stop' })
        workerRef.current.terminate()
      }
    }

    // Register this tab
    registerTab(pageInfo)
    broadcast('open')

    // Defer initial state update to avoid setState in effect body
    const initialTimeout = setTimeout(cleanupAndGetPages, 0)

    // Start worker heartbeat
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'start' })
    } else {
      // Fallback: use main thread interval
      const fallbackInterval = setInterval(() => {
        sendHeartbeat()
        cleanupAndGetPages()
      }, 3000)

      // Store interval ID for cleanup
      workerRef.current = { fallbackInterval }
    }

    // Add event listeners
    window.addEventListener('storage', handleStorageChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleUnload)

    return () => {
      clearTimeout(initialTimeout)
      window.removeEventListener('storage', handleStorageChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleUnload)

      unregisterTab()
      broadcast('close')

      if (workerRef.current) {
        if (workerRef.current.fallbackInterval) {
          clearInterval(workerRef.current.fallbackInterval)
        } else {
          workerRef.current.postMessage({ type: 'stop' })
          workerRef.current.terminate()
        }
      }

      if (channelRef.current) {
        channelRef.current.close()
      }
    }
  }, [tabId, registerTab, unregisterTab, sendHeartbeat, cleanupAndGetPages, broadcast])

  return {
    openPages,
    currentTabId: tabId,
    openCount: openPages.length,
  }
}
