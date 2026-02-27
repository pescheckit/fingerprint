const HEARTBEAT_INTERVAL = 3000

let heartbeatTimer = null

self.onmessage = function(e) {
  const { type } = e.data

  switch (type) {
    case 'start':
      startHeartbeat()
      break

    case 'stop':
      stopHeartbeat()
      break

    case 'tick':
      // Manual tick request
      self.postMessage({ type: 'tick' })
      break
  }
}

function startHeartbeat() {
  stopHeartbeat()

  // Send initial tick
  self.postMessage({ type: 'tick' })

  // Start interval
  heartbeatTimer = setInterval(() => {
    self.postMessage({ type: 'tick' })
  }, HEARTBEAT_INTERVAL)
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
}
