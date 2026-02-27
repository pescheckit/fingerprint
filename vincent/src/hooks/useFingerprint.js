import { useState, useEffect } from 'react'
import FingerprintJS from '@fingerprintjs/fingerprintjs'

export function useFingerprint() {
  const [fingerprint, setFingerprint] = useState(null)
  const [components, setComponents] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function getFingerprint() {
      try {
        const fp = await FingerprintJS.load()
        const result = await fp.get()

        setFingerprint(result.visitorId)
        setComponents(result.components)
        setLoading(false)
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    }

    getFingerprint()
  }, [])

  return { fingerprint, components, loading, error }
}

export function useCustomSignals() {
  const [signals, setSignals] = useState(null)
  const [deviceFingerprint, setDeviceFingerprint] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function collectSignals() {
      const collected = {}

      // Screen info
      collected.screen = {
        width: window.screen.width,
        height: window.screen.height,
        colorDepth: window.screen.colorDepth,
        pixelRatio: window.devicePixelRatio,
        availWidth: window.screen.availWidth,
        availHeight: window.screen.availHeight,
      }

      // Navigator info
      collected.navigator = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        languages: navigator.languages?.join(', '),
        platform: navigator.platform,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigator.deviceMemory,
        maxTouchPoints: navigator.maxTouchPoints,
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
      }

      // Timezone
      collected.timezone = {
        offset: new Date().getTimezoneOffset(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }

      // Canvas fingerprint
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = 200
        canvas.height = 50

        ctx.textBaseline = 'top'
        ctx.font = '14px Arial'
        ctx.fillStyle = '#f60'
        ctx.fillRect(125, 1, 62, 20)
        ctx.fillStyle = '#069'
        ctx.fillText('Fingerprint', 2, 15)
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
        ctx.fillText('Canvas Test', 4, 17)

        collected.canvas = {
          hash: hashCode(canvas.toDataURL()),
          supported: true,
        }
      } catch (e) {
        collected.canvas = { supported: false, error: e.message }
      }

      // WebGL info
      try {
        const canvas = document.createElement('canvas')
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')

        if (gl) {
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
          collected.webgl = {
            vendor: gl.getParameter(gl.VENDOR),
            renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'N/A',
            version: gl.getParameter(gl.VERSION),
            shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
            supported: true,
          }
        } else {
          collected.webgl = { supported: false }
        }
      } catch (e) {
        collected.webgl = { supported: false, error: e.message }
      }

      // Enhanced Audio fingerprint (cross-browser device identification)
      try {
        const audioFingerprint = await getAudioFingerprint()
        collected.audio = audioFingerprint
      } catch (e) {
        collected.audio = { supported: false, error: e.message }
      }

      // Font detection (basic)
      collected.fonts = {
        monospace: detectFont('monospace'),
        sansSerif: detectFont('sans-serif'),
        serif: detectFont('serif'),
      }

      // Storage availability
      collected.storage = {
        localStorage: !!window.localStorage,
        sessionStorage: !!window.sessionStorage,
        indexedDB: !!window.indexedDB,
      }

      // Cookies tracking
      collected.cookies = getCookiesFingerprint()

      // localStorage tracking
      collected.localStorageData = getLocalStorageFingerprint()

      // sessionStorage tracking
      collected.sessionStorageData = getSessionStorageFingerprint()

      // IndexedDB tracking
      try {
        collected.indexedDBData = await getIndexedDBFingerprint()
      } catch (e) {
        collected.indexedDBData = { supported: false, error: e.message }
      }

      // Connection info
      if (navigator.connection) {
        collected.connection = {
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          rtt: navigator.connection.rtt,
          saveData: navigator.connection.saveData,
        }
      }

      // Battery info (if available)
      if (navigator.getBattery) {
        try {
          const battery = await navigator.getBattery()
          collected.battery = {
            charging: battery.charging,
            level: battery.level,
          }
        } catch {
          collected.battery = { supported: false }
        }
      }

      // WebGL Rendering fingerprint (GPU-specific quirks, cross-browser stable)
      try {
        collected.webglRender = await getWebGLRenderFingerprint()
      } catch (e) {
        collected.webglRender = { supported: false, error: e.message }
      }

      // Speech Synthesis Voices (OS-level, cross-browser)
      try {
        collected.speechVoices = await getSpeechVoicesFingerprint()
      } catch (e) {
        collected.speechVoices = { supported: false, error: e.message }
      }

      // Math engine fingerprint (reveals JS engine/hardware quirks)
      collected.mathFingerprint = getMathFingerprint()

      // WebRTC fingerprint (can reveal local IP)
      try {
        collected.webrtc = await getWebRTCFingerprint()
      } catch (e) {
        collected.webrtc = { supported: false, error: e.message }
      }

      // Comprehensive font detection (cross-browser stable)
      collected.fontsDetailed = getDetailedFontFingerprint()

      // Hardware/OS-level signals
      collected.system = {
        oscpu: navigator.oscpu || 'N/A',
        vendor: navigator.vendor,
        vendorSub: navigator.vendorSub || 'N/A',
        productSub: navigator.productSub,
        buildID: navigator.buildID || 'N/A',
        pdfViewerEnabled: navigator.pdfViewerEnabled,
        webdriver: navigator.webdriver,
      }

      // Media devices (cross-browser device identifier)
      try {
        collected.mediaDevices = await getMediaDevicesFingerprint()
      } catch (e) {
        collected.mediaDevices = { supported: false, error: e.message }
      }

      // IP Information (public IP from API + local IPs from WebRTC)
      try {
        collected.ipInfo = await getIPFingerprint(collected.webrtc)
      } catch (e) {
        collected.ipInfo = { supported: false, error: e.message }
      }

      // Browsing Context (referrer, history length, navigation type)
      collected.browsingContext = getBrowsingContext()

      // Navigation Timing (page load performance data)
      collected.navigationTiming = getNavigationTiming()

      // Performance Resources (loaded resources on this page)
      collected.performanceResources = getPerformanceResources()

      // Client Hints API (high entropy device info)
      try {
        collected.clientHints = await getClientHintsFingerprint()
      } catch (e) {
        collected.clientHints = { supported: false, error: e.message }
      }

      // Enhanced WebGL parameters (full GPU capability fingerprint)
      try {
        collected.webglParams = getWebGLParametersFingerprint()
      } catch (e) {
        collected.webglParams = { supported: false, error: e.message }
      }

      // Device Sensors (accelerometer, gyroscope, etc.)
      try {
        collected.deviceSensors = await getDeviceSensorsFingerprint()
      } catch (e) {
        collected.deviceSensors = { supported: false, error: e.message }
      }

      // Gamepad API
      collected.gamepads = getGamepadFingerprint()

      // Media Capabilities (hardware codec support)
      try {
        collected.mediaCapabilities = await getMediaCapabilitiesFingerprint()
      } catch (e) {
        collected.mediaCapabilities = { supported: false, error: e.message }
      }

      // Extended Screen Properties
      collected.screenExtended = getExtendedScreenFingerprint()

      // Performance Memory (JS heap info)
      collected.performanceMemory = getPerformanceMemoryFingerprint()

      // Hardware Permissions Status
      try {
        collected.permissionsStatus = await getPermissionsFingerprint()
      } catch (e) {
        collected.permissionsStatus = { supported: false, error: e.message }
      }

      // Generate device fingerprint from cross-browser stable signals
      const deviceFp = generateDeviceFingerprint(collected)
      setDeviceFingerprint(deviceFp)

      setSignals(collected)
      setLoading(false)
    }

    collectSignals()
  }, [])

  return { signals, deviceFingerprint, loading }
}

// Generate a stable device fingerprint from cross-browser signals
// ONLY uses signals that are 100% identical across Chrome, Firefox, Safari, Edge
function generateDeviceFingerprint(signals) {
  const stableSignals = []

  // === CORE HARDWARE SIGNALS (guaranteed identical across browsers) ===

  // Screen resolution - direct hardware property
  if (signals.screen) {
    stableSignals.push(`scr:${signals.screen.width}x${signals.screen.height}`)
    stableSignals.push(`cd:${signals.screen.colorDepth}`)
    stableSignals.push(`pr:${signals.screen.pixelRatio}`)
    // Available screen (excludes taskbar) - also hardware-level
    stableSignals.push(`avail:${signals.screen.availWidth}x${signals.screen.availHeight}`)
  }

  // Timezone - OS setting, identical across browsers
  if (signals.timezone?.timezone) {
    stableSignals.push(`tz:${signals.timezone.timezone}`)
  }

  // CPU cores - hardware, all browsers report the same
  if (signals.navigator?.hardwareConcurrency) {
    stableSignals.push(`cpu:${signals.navigator.hardwareConcurrency}`)
  }

  // Touch capability - hardware
  if (signals.navigator?.maxTouchPoints !== undefined) {
    stableSignals.push(`touch:${signals.navigator.maxTouchPoints}`)
  }

  // Platform - normalize to OS name only
  if (signals.navigator?.platform) {
    const platform = normalizePlatform(signals.navigator.platform)
    stableSignals.push(`os:${platform}`)
  }

  // Primary language - user preference, consistent across browsers
  if (signals.navigator?.language) {
    // Normalize language (some browsers use en-US, others en-us)
    const lang = signals.navigator.language.toLowerCase()
    stableSignals.push(`lang:${lang}`)
  }

  // Cookie enabled - browser setting but usually consistent
  if (signals.navigator?.cookieEnabled !== undefined) {
    stableSignals.push(`cookie:${signals.navigator.cookieEnabled ? 1 : 0}`)
  }

  // === NOTE: Intentionally NOT using these (vary by browser engine): ===
  // - Canvas/WebGL hashes (different rendering engines)
  // - Audio fingerprint (different audio processing)
  // - Math fingerprint (different JS engines)
  // - Font detection (measurement varies)
  // - Speech voices (enumeration can vary)
  // - Media devices (requires permission, varies)
  // - deviceMemory (Firefox doesn't support)
  // - WebGL vendor/renderer (Firefox often blocks)

  const combined = stableSignals.join('|')
  const hash = hashCodeLong(combined)

  return {
    id: hash,
    signalsUsed: stableSignals.length,
    entropy: calculateEntropy(stableSignals),
    rawSignals: stableSignals,
  }
}

// Normalize platform string for cross-browser consistency
function normalizePlatform(platform) {
  const p = platform.toLowerCase()
  if (p.includes('win')) return 'windows'
  if (p.includes('mac')) return 'macos'
  if (p.includes('linux')) return 'linux'
  if (p.includes('android')) return 'android'
  if (p.includes('iphone') || p.includes('ipad') || p.includes('ios')) return 'ios'
  return platform
}

// Longer hash for device fingerprint
function hashCodeLong(str) {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  const combined = 4294967296 * (2097151 & h2) + (h1 >>> 0)
  return combined.toString(36).toUpperCase()
}

// Estimate entropy bits
function calculateEntropy(signals) {
  // Rough entropy estimation based on signal count and uniqueness
  const baseEntropy = signals.length * 4 // ~4 bits per signal on average
  return Math.min(baseEntropy, 64) // Cap at 64 bits
}

function hashCode(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(16)
}

function detectFont(baseFont) {
  const testString = 'mmmmmmmmmmlli'
  const testSize = '72px'
  const testFonts = ['Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia']

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  ctx.font = `${testSize} ${baseFont}`
  const baseWidth = ctx.measureText(testString).width

  const detected = []
  for (const font of testFonts) {
    ctx.font = `${testSize} "${font}", ${baseFont}`
    const width = ctx.measureText(testString).width
    if (width !== baseWidth) {
      detected.push(font)
    }
  }

  return detected.join(', ') || 'default only'
}

// Enhanced Audio Fingerprint using AudioContext oscillator/compressor
// This produces device-specific floating-point values that are stable across browsers
async function getAudioFingerprint() {
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) {
    return { supported: false }
  }

  const context = new AudioContext()
  const oscillator = context.createOscillator()
  const analyser = context.createAnalyser()
  const gainNode = context.createGain()
  const compressor = context.createDynamicsCompressor()

  // Configure compressor (these settings affect the audio processing fingerprint)
  compressor.threshold.value = -50
  compressor.knee.value = 40
  compressor.ratio.value = 12
  compressor.attack.value = 0
  compressor.release.value = 0.25

  // Configure oscillator
  oscillator.type = 'triangle'
  oscillator.frequency.value = 10000

  // Connect nodes
  oscillator.connect(compressor)
  compressor.connect(analyser)
  analyser.connect(gainNode)
  gainNode.connect(context.destination)
  gainNode.gain.value = 0 // Mute output

  oscillator.start(0)

  // Create offline context for deterministic rendering
  const offlineContext = new OfflineAudioContext(1, 4410, 44100)
  const offlineOscillator = offlineContext.createOscillator()
  const offlineCompressor = offlineContext.createDynamicsCompressor()

  offlineCompressor.threshold.value = -50
  offlineCompressor.knee.value = 40
  offlineCompressor.ratio.value = 12
  offlineCompressor.attack.value = 0
  offlineCompressor.release.value = 0.25

  offlineOscillator.type = 'triangle'
  offlineOscillator.frequency.value = 10000
  offlineOscillator.connect(offlineCompressor)
  offlineCompressor.connect(offlineContext.destination)
  offlineOscillator.start(0)

  try {
    const buffer = await offlineContext.startRendering()
    const channelData = buffer.getChannelData(0)

    // Sum samples to create fingerprint
    let sum = 0
    for (let i = 4500; i < 5000; i++) {
      sum += Math.abs(channelData[i])
    }

    oscillator.stop()
    await context.close()

    return {
      supported: true,
      sampleRate: context.sampleRate,
      maxChannelCount: context.destination.maxChannelCount,
      hash: hashCode(sum.toString()),
      sum: sum,
      channelCount: context.destination.channelCount,
      state: context.state,
    }
  } catch (e) {
    oscillator.stop()
    await context.close()
    return {
      supported: true,
      sampleRate: context.sampleRate,
      maxChannelCount: context.destination.maxChannelCount,
      error: e.message,
    }
  }
}

// WebGL Rendering fingerprint - draws a 3D scene and hashes the result
// GPU-specific rendering quirks make this stable across browsers on same device
async function getWebGLRenderFingerprint() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256

  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
  if (!gl) {
    return { supported: false }
  }

  // Vertex shader
  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;
    varying lowp vec4 vColor;
    void main(void) {
      gl_Position = aVertexPosition;
      vColor = aVertexColor;
    }
  `

  // Fragment shader
  const fsSource = `
    varying lowp vec4 vColor;
    void main(void) {
      gl_FragColor = vColor;
    }
  `

  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vsSource)
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fsSource)

  if (!vertexShader || !fragmentShader) {
    return { supported: false, error: 'shader compilation failed' }
  }

  const program = gl.createProgram()
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    return { supported: false, error: 'program link failed' }
  }

  gl.useProgram(program)

  // Create vertices for a complex shape
  const positions = new Float32Array([
    0.0, 0.5, 0.0,
    -0.5, -0.5, 0.0,
    0.5, -0.5, 0.0,
    0.3, 0.3, 0.0,
    -0.3, 0.3, 0.0,
    0.0, -0.4, 0.0,
  ])

  const colors = new Float32Array([
    1.0, 0.0, 0.0, 1.0,
    0.0, 1.0, 0.0, 1.0,
    0.0, 0.0, 1.0, 1.0,
    1.0, 1.0, 0.0, 1.0,
    0.0, 1.0, 1.0, 1.0,
    1.0, 0.0, 1.0, 1.0,
  ])

  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

  const positionLocation = gl.getAttribLocation(program, 'aVertexPosition')
  gl.enableVertexAttribArray(positionLocation)
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0)

  const colorBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW)

  const colorLocation = gl.getAttribLocation(program, 'aVertexColor')
  gl.enableVertexAttribArray(colorLocation)
  gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0)

  // Clear and draw
  gl.clearColor(0.2, 0.2, 0.2, 1.0)
  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.drawArrays(gl.TRIANGLES, 0, 6)

  // Read pixels and hash
  const pixels = new Uint8Array(256 * 256 * 4)
  gl.readPixels(0, 0, 256, 256, gl.RGBA, gl.UNSIGNED_BYTE, pixels)

  let pixelSum = 0
  for (let i = 0; i < pixels.length; i += 100) {
    pixelSum += pixels[i]
  }

  return {
    supported: true,
    hash: hashCode(canvas.toDataURL()),
    pixelSum: pixelSum,
    antialiasing: gl.getContextAttributes()?.antialias,
  }
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader)
    return null
  }
  return shader
}

// Speech Synthesis Voices - OS-level, stable across browsers
async function getSpeechVoicesFingerprint() {
  if (!window.speechSynthesis) {
    return { supported: false }
  }

  // Voices may load asynchronously
  let voices = window.speechSynthesis.getVoices()
  if (voices.length === 0) {
    await new Promise((resolve) => {
      window.speechSynthesis.onvoiceschanged = resolve
      setTimeout(resolve, 1000) // Timeout fallback
    })
    voices = window.speechSynthesis.getVoices()
  }

  const voiceData = voices.map((v) => ({
    name: v.name,
    lang: v.lang,
    local: v.localService,
  }))

  return {
    supported: true,
    count: voices.length,
    languages: [...new Set(voices.map((v) => v.lang))].sort().join(', '),
    localVoices: voices.filter((v) => v.localService).length,
    hash: hashCode(JSON.stringify(voiceData)),
  }
}

// Math fingerprint - reveals JS engine and floating-point hardware quirks
function getMathFingerprint() {
  const results = {
    // These operations can produce different results on different hardware/engines
    tan: Math.tan(-1e300),
    sin: Math.sin(0.5),
    cos: Math.cos(0.5),
    exp: Math.exp(1),
    log: Math.log(10),
    sqrt: Math.sqrt(2),
    pow: Math.pow(Math.PI, -100),
    acos: Math.acos(0.5),
    asin: Math.asin(0.5),
    atan: Math.atan(0.5),
    atan2: Math.atan2(0.04, 0.04),
    sinh: Math.sinh(0.5),
    cosh: Math.cosh(0.5),
    tanh: Math.tanh(0.5),
    expm1: Math.expm1(1),
    log1p: Math.log1p(0.5),
    // Edge cases that may vary
    acoshPi: Math.acosh(Math.PI),
    cbrt: Math.cbrt(Math.PI),
    // Special value combinations
    combo1: Math.pow(2, -1074),
    combo2: Math.log(Math.E * Math.PI),
  }

  // Create hash from results
  const fingerprint = Object.values(results)
    .map((v) => v.toString())
    .join('|')

  return {
    hash: hashCode(fingerprint),
    sample: {
      tan: results.tan,
      pow: results.pow,
      acoshPi: results.acoshPi,
    },
  }
}

// WebRTC fingerprint - can reveal local IP addresses
async function getWebRTCFingerprint() {
  if (!window.RTCPeerConnection) {
    return { supported: false }
  }

  const ips = []
  const candidates = []

  try {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    })

    pc.createDataChannel('')

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        candidates.push(e.candidate.candidate)
        // Extract IP addresses
        const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/g
        const matches = e.candidate.candidate.match(ipRegex)
        if (matches) {
          matches.forEach((ip) => {
            if (!ips.includes(ip)) {
              ips.push(ip)
            }
          })
        }
      }
    }

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    // Wait for ICE gathering
    await new Promise((resolve) => {
      if (pc.iceGatheringState === 'complete') {
        resolve()
      } else {
        const checkState = () => {
          if (pc.iceGatheringState === 'complete') {
            resolve()
          }
        }
        pc.onicegatheringstatechange = checkState
        setTimeout(resolve, 3000) // Timeout
      }
    })

    pc.close()

    return {
      supported: true,
      localIPs: ips,
      candidateCount: candidates.length,
      hasIPv4: ips.some((ip) => !ip.includes(':')),
      hasIPv6: ips.some((ip) => ip.includes(':')),
    }
  } catch (e) {
    return { supported: false, error: e.message }
  }
}

// Comprehensive font detection with more fonts
function getDetailedFontFingerprint() {
  const testFonts = [
    // Windows fonts
    'Arial',
    'Arial Black',
    'Calibri',
    'Cambria',
    'Comic Sans MS',
    'Consolas',
    'Courier New',
    'Georgia',
    'Impact',
    'Lucida Console',
    'Segoe UI',
    'Tahoma',
    'Times New Roman',
    'Trebuchet MS',
    'Verdana',
    // macOS fonts
    'American Typewriter',
    'Avenir',
    'Futura',
    'Geneva',
    'Helvetica',
    'Helvetica Neue',
    'Menlo',
    'Monaco',
    'Optima',
    'Palatino',
    'San Francisco',
    // Linux fonts
    'DejaVu Sans',
    'DejaVu Serif',
    'Droid Sans',
    'Liberation Mono',
    'Liberation Sans',
    'Noto Sans',
    'Ubuntu',
    // Common web fonts
    'Open Sans',
    'Roboto',
    'Lato',
    'Montserrat',
    'Source Sans Pro',
    // Asian fonts
    'MS Gothic',
    'MS Mincho',
    'SimSun',
    'PMingLiU',
    'Malgun Gothic',
  ]

  const baseFonts = ['monospace', 'sans-serif', 'serif']
  const testString = 'mmmmmmmmmmlli1234567890'
  const testSize = '72px'

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  const baseWidths = {}
  for (const baseFont of baseFonts) {
    ctx.font = `${testSize} ${baseFont}`
    baseWidths[baseFont] = ctx.measureText(testString).width
  }

  const detected = []
  for (const font of testFonts) {
    for (const baseFont of baseFonts) {
      ctx.font = `${testSize} "${font}", ${baseFont}`
      const width = ctx.measureText(testString).width
      if (width !== baseWidths[baseFont]) {
        detected.push(font)
        break
      }
    }
  }

  return {
    count: detected.length,
    fonts: detected.join(', '),
    hash: hashCode(detected.join('|')),
  }
}

// Media devices fingerprint (cameras, microphones)
async function getMediaDevicesFingerprint() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    return { supported: false }
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices()

    const deviceTypes = {
      audioinput: 0,
      audiooutput: 0,
      videoinput: 0,
    }

    const deviceIds = []
    for (const device of devices) {
      if (deviceTypes[device.kind] !== undefined) {
        deviceTypes[device.kind]++
      }
      if (device.deviceId && device.deviceId !== 'default') {
        deviceIds.push(device.deviceId.slice(0, 8))
      }
    }

    return {
      supported: true,
      audioInputs: deviceTypes.audioinput,
      audioOutputs: deviceTypes.audiooutput,
      videoInputs: deviceTypes.videoinput,
      totalDevices: devices.length,
      hash: hashCode(deviceIds.join('|')),
    }
  } catch (e) {
    return { supported: false, error: e.message }
  }
}

// IP fingerprint - combines public IP from API with local IPs from WebRTC
async function getIPFingerprint(webrtcData) {
  const result = {
    supported: true,
    publicIP: null,
    localIPs: [],
    country: null,
    city: null,
    region: null,
    asn: null,
    asOrg: null,
    isIPv6: false,
  }

  // Get public IP from API
  try {
    const response = await fetch('/vincent/api/ip')
    if (response.ok) {
      const data = await response.json()
      result.publicIP = data.ip || null
      result.country = data.country || null
      result.city = data.city || null
      result.region = data.region || null
      result.asn = data.asn || null
      result.asOrg = data.asOrg || null
      result.isIPv6 = data.isIPv6 || false
    }
  } catch (e) {
    result.publicIPError = e.message
  }

  // Get local IPs from WebRTC data (already collected)
  if (webrtcData?.localIPs) {
    result.localIPs = webrtcData.localIPs
  }

  return result
}

// Browsing Context - referrer, history length, navigation type
function getBrowsingContext() {
  const context = {
    // Document referrer (where user came from)
    referrer: document.referrer || null,
    referrerDomain: null,
    isExternalReferrer: false,

    // History information
    historyLength: history.length,

    // Current page info
    currentURL: window.location.href,
    currentOrigin: window.location.origin,
    currentPath: window.location.pathname,
    currentSearch: window.location.search || null,
    currentHash: window.location.hash || null,

    // Navigation type
    navigationType: null,
    redirectCount: 0,

    // Document state
    documentState: document.readyState,
    visibilityState: document.visibilityState,
    hidden: document.hidden,

    // Opener (if opened via window.open)
    hasOpener: !!window.opener,

    // Ancestor origins (for iframes)
    isInIframe: window.self !== window.top,
    ancestorOrigins: [],
  }

  // Parse referrer domain
  if (context.referrer) {
    try {
      const refURL = new URL(context.referrer)
      context.referrerDomain = refURL.hostname
      context.isExternalReferrer = refURL.origin !== window.location.origin
    } catch {
      // Invalid URL
    }
  }

  // Get navigation type from Performance API
  if (performance.getEntriesByType) {
    const navEntries = performance.getEntriesByType('navigation')
    if (navEntries.length > 0) {
      const nav = navEntries[0]
      context.navigationType = nav.type // 'navigate', 'reload', 'back_forward', 'prerender'
      context.redirectCount = nav.redirectCount
    }
  }

  // Get ancestor origins (for cross-origin iframe detection)
  if (window.location.ancestorOrigins) {
    context.ancestorOrigins = Array.from(window.location.ancestorOrigins)
  }

  return context
}

// Navigation Timing - detailed page load performance metrics
function getNavigationTiming() {
  if (!performance.getEntriesByType) {
    return { supported: false }
  }

  const navEntries = performance.getEntriesByType('navigation')
  if (navEntries.length === 0) {
    return { supported: false }
  }

  const nav = navEntries[0]

  return {
    supported: true,
    // Navigation type
    type: nav.type,
    redirectCount: nav.redirectCount,

    // Timing metrics (in ms)
    timing: {
      // DNS
      dnsLookup: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
      // TCP connection
      tcpConnect: Math.round(nav.connectEnd - nav.connectStart),
      // SSL/TLS
      sslHandshake: nav.secureConnectionStart > 0
        ? Math.round(nav.connectEnd - nav.secureConnectionStart)
        : 0,
      // Request/Response
      requestTime: Math.round(nav.responseStart - nav.requestStart),
      responseTime: Math.round(nav.responseEnd - nav.responseStart),
      // DOM processing
      domInteractive: Math.round(nav.domInteractive - nav.responseEnd),
      domComplete: Math.round(nav.domComplete - nav.responseEnd),
      // Total load time
      loadComplete: Math.round(nav.loadEventEnd - nav.startTime),
      // Time to first byte
      ttfb: Math.round(nav.responseStart - nav.requestStart),
    },

    // Transfer sizes
    transfer: {
      encodedBodySize: nav.encodedBodySize,
      decodedBodySize: nav.decodedBodySize,
      transferSize: nav.transferSize,
    },

    // Protocol info
    protocol: nav.nextHopProtocol,

    // Cache status (transferSize = 0 means from cache)
    fromCache: nav.transferSize === 0 && nav.decodedBodySize > 0,
  }
}

// Performance Resources - all resources loaded on this page
function getPerformanceResources() {
  if (!performance.getEntriesByType) {
    return { supported: false }
  }

  const resources = performance.getEntriesByType('resource')

  // Group by type
  const byType = {}
  const externalDomains = new Set()
  let totalTransferSize = 0
  let totalDecodedSize = 0

  const resourceList = resources.map((r) => {
    // Determine resource type
    let type = r.initiatorType
    if (r.name.includes('.js')) type = 'script'
    else if (r.name.includes('.css')) type = 'stylesheet'
    else if (r.name.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)/i)) type = 'image'
    else if (r.name.match(/\.(woff|woff2|ttf|otf|eot)/i)) type = 'font'

    // Count by type
    byType[type] = (byType[type] || 0) + 1

    // Track external domains
    try {
      const url = new URL(r.name)
      if (url.origin !== window.location.origin) {
        externalDomains.add(url.hostname)
      }
    } catch {
      // Invalid URL
    }

    // Sum sizes
    totalTransferSize += r.transferSize || 0
    totalDecodedSize += r.decodedBodySize || 0

    return {
      name: r.name.length > 100 ? '...' + r.name.slice(-80) : r.name,
      type,
      duration: Math.round(r.duration),
      transferSize: r.transferSize,
      decodedSize: r.decodedBodySize,
      protocol: r.nextHopProtocol,
      fromCache: r.transferSize === 0 && r.decodedBodySize > 0,
    }
  })

  // Sort by duration (slowest first)
  resourceList.sort((a, b) => b.duration - a.duration)

  return {
    supported: true,
    totalCount: resources.length,
    byType,
    externalDomains: Array.from(externalDomains),
    externalDomainCount: externalDomains.size,
    totalTransferSize,
    totalTransferSizeKB: (totalTransferSize / 1024).toFixed(1),
    totalDecodedSize,
    totalDecodedSizeKB: (totalDecodedSize / 1024).toFixed(1),
    // Top 10 slowest resources
    slowestResources: resourceList.slice(0, 10),
    // All resources (for detailed view)
    allResources: resourceList,
  }
}

// Cookie tracking - get all cookies for current domain
function getCookiesFingerprint() {
  const cookieString = document.cookie
  const cookies = []

  if (!cookieString) {
    return {
      enabled: navigator.cookieEnabled,
      count: 0,
      cookies: [],
      totalSize: 0,
    }
  }

  // Parse all cookies
  const pairs = cookieString.split(';')
  for (const pair of pairs) {
    const trimmed = pair.trim()
    if (!trimmed) continue

    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue

    const name = trimmed.substring(0, eqIndex)
    const value = trimmed.substring(eqIndex + 1)

    cookies.push({
      name,
      value,
      size: trimmed.length,
      // Try to decode if URL encoded
      decodedValue: tryDecodeURIComponent(value),
      // Detect common cookie types
      type: detectCookieType(name, value),
    })
  }

  return {
    enabled: navigator.cookieEnabled,
    count: cookies.length,
    cookies: cookies,
    totalSize: cookieString.length,
    names: cookies.map((c) => c.name).join(', '),
  }
}

// Try to decode URI component safely
function tryDecodeURIComponent(value) {
  try {
    const decoded = decodeURIComponent(value)
    return decoded !== value ? decoded : null
  } catch {
    return null
  }
}

// Detect common cookie types based on name patterns
function detectCookieType(name, value) {
  const nameLower = name.toLowerCase()

  // Session/Auth cookies
  if (nameLower.includes('session') || nameLower.includes('sess')) return 'session'
  if (nameLower.includes('auth') || nameLower.includes('token')) return 'auth'
  if (nameLower.includes('jwt')) return 'jwt'

  // Tracking/Analytics
  if (nameLower.includes('_ga') || nameLower.includes('_gid')) return 'analytics:google'
  if (nameLower.includes('_fbp') || nameLower.includes('_fbc')) return 'analytics:facebook'
  if (nameLower.includes('analytics')) return 'analytics'
  if (nameLower.includes('track')) return 'tracking'

  // Preferences
  if (nameLower.includes('pref') || nameLower.includes('settings')) return 'preference'
  if (nameLower.includes('consent') || nameLower.includes('gdpr')) return 'consent'
  if (nameLower.includes('theme') || nameLower.includes('dark')) return 'preference:theme'
  if (nameLower.includes('lang') || nameLower.includes('locale')) return 'preference:language'

  // Security
  if (nameLower.includes('csrf') || nameLower.includes('xsrf')) return 'security:csrf'

  // Cloudflare
  if (nameLower.includes('__cf')) return 'cloudflare'

  // Fingerprint related
  if (nameLower.includes('fingerprint') || nameLower.includes('fp_')) return 'fingerprint'
  if (nameLower.includes('visitor')) return 'visitor'

  // Check value patterns
  if (value.length === 36 && value.includes('-')) return 'uuid'
  if (value.length > 100) return 'large'

  return 'other'
}

// localStorage tracking
function getLocalStorageFingerprint() {
  if (!window.localStorage) {
    return { supported: false }
  }

  try {
    const items = []
    let totalSize = 0

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      const value = localStorage.getItem(key)
      const size = key.length + (value ? value.length : 0)
      totalSize += size

      items.push({
        key,
        value,
        size,
        type: detectStorageType(key, value),
        isJSON: isJSONString(value),
        parsed: tryParseJSON(value),
      })
    }

    // Sort by size descending
    items.sort((a, b) => b.size - a.size)

    return {
      supported: true,
      count: items.length,
      items,
      totalSize,
      totalSizeKB: (totalSize / 1024).toFixed(2),
    }
  } catch (e) {
    return { supported: false, error: e.message }
  }
}

// sessionStorage tracking
function getSessionStorageFingerprint() {
  if (!window.sessionStorage) {
    return { supported: false }
  }

  try {
    const items = []
    let totalSize = 0

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      const value = sessionStorage.getItem(key)
      const size = key.length + (value ? value.length : 0)
      totalSize += size

      items.push({
        key,
        value,
        size,
        type: detectStorageType(key, value),
        isJSON: isJSONString(value),
        parsed: tryParseJSON(value),
      })
    }

    // Sort by size descending
    items.sort((a, b) => b.size - a.size)

    return {
      supported: true,
      count: items.length,
      items,
      totalSize,
      totalSizeKB: (totalSize / 1024).toFixed(2),
    }
  } catch (e) {
    return { supported: false, error: e.message }
  }
}

// Detect storage item type based on key patterns
function detectStorageType(key, value) {
  const keyLower = key.toLowerCase()

  // App state
  if (keyLower.includes('state') || keyLower.includes('redux') || keyLower.includes('vuex')) return 'state'
  if (keyLower.includes('persist')) return 'persist'

  // User data
  if (keyLower.includes('user') || keyLower.includes('profile')) return 'user'
  if (keyLower.includes('auth') || keyLower.includes('token')) return 'auth'
  if (keyLower.includes('session')) return 'session'

  // Preferences
  if (keyLower.includes('pref') || keyLower.includes('settings') || keyLower.includes('config')) return 'preference'
  if (keyLower.includes('theme') || keyLower.includes('dark') || keyLower.includes('mode')) return 'preference:theme'
  if (keyLower.includes('lang') || keyLower.includes('locale') || keyLower.includes('i18n')) return 'preference:language'

  // Cache
  if (keyLower.includes('cache') || keyLower.includes('cached')) return 'cache'

  // Analytics/Tracking
  if (keyLower.includes('analytics') || keyLower.includes('_ga')) return 'analytics'
  if (keyLower.includes('track') || keyLower.includes('visitor')) return 'tracking'

  // Fingerprint
  if (keyLower.includes('fingerprint') || keyLower.includes('fp_') || keyLower.includes('device')) return 'fingerprint'
  if (keyLower.includes('history')) return 'history'

  // Debug/Dev
  if (keyLower.includes('debug') || keyLower.includes('dev') || keyLower.includes('log')) return 'debug'

  // Check value patterns
  if (isJSONString(value)) {
    const parsed = tryParseJSON(value)
    if (parsed && Array.isArray(parsed)) return 'array'
    if (parsed && typeof parsed === 'object') return 'object'
  }

  return 'other'
}

// Check if string is valid JSON
function isJSONString(str) {
  if (!str || typeof str !== 'string') return false
  const trimmed = str.trim()
  return (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
         (trimmed.startsWith('[') && trimmed.endsWith(']'))
}

// Try to parse JSON safely
function tryParseJSON(str) {
  if (!isJSONString(str)) return null
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}

// IndexedDB tracking
async function getIndexedDBFingerprint() {
  if (!window.indexedDB) {
    return { supported: false }
  }

  const databases = []
  let totalRecords = 0
  let totalSize = 0

  try {
    // Get list of all databases (modern browsers)
    if (indexedDB.databases) {
      const dbList = await indexedDB.databases()

      for (const dbInfo of dbList) {
        const dbData = await analyzeDatabase(dbInfo.name, dbInfo.version)
        if (dbData) {
          databases.push(dbData)
          totalRecords += dbData.totalRecords
          totalSize += dbData.estimatedSize
        }
      }
    } else {
      // Fallback: try common database names
      const commonNames = [
        'fingerprint_history',
        'localforage',
        'keyval-store',
        'firebaseLocalStorageDb',
        '__sentry__',
      ]

      for (const name of commonNames) {
        try {
          const dbData = await analyzeDatabase(name)
          if (dbData) {
            databases.push(dbData)
            totalRecords += dbData.totalRecords
            totalSize += dbData.estimatedSize
          }
        } catch {
          // Database doesn't exist, skip
        }
      }
    }

    return {
      supported: true,
      count: databases.length,
      databases,
      totalRecords,
      totalSizeKB: (totalSize / 1024).toFixed(2),
    }
  } catch (e) {
    return { supported: false, error: e.message }
  }
}

// Analyze a single IndexedDB database
async function analyzeDatabase(name, version) {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(name)

      request.onerror = () => {
        resolve(null)
      }

      request.onsuccess = async (event) => {
        const db = event.target.result
        const objectStoreNames = Array.from(db.objectStoreNames)

        const stores = []
        let totalRecords = 0
        let estimatedSize = 0

        // Analyze each object store
        for (const storeName of objectStoreNames) {
          try {
            const storeData = await analyzeObjectStore(db, storeName)
            stores.push(storeData)
            totalRecords += storeData.count
            estimatedSize += storeData.estimatedSize
          } catch {
            stores.push({
              name: storeName,
              count: 0,
              error: 'Could not read store',
            })
          }
        }

        db.close()

        resolve({
          name,
          version: db.version,
          storeCount: objectStoreNames.length,
          stores,
          totalRecords,
          estimatedSize,
          type: detectDatabaseType(name),
        })
      }

      // Handle upgrade needed (database exists but version mismatch)
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        db.close()
        resolve({
          name,
          version: version || 'unknown',
          storeCount: 0,
          stores: [],
          totalRecords: 0,
          estimatedSize: 0,
          note: 'Version mismatch - could not fully analyze',
          type: detectDatabaseType(name),
        })
      }

      // Timeout fallback
      setTimeout(() => resolve(null), 2000)
    } catch {
      resolve(null)
    }
  })
}

// Analyze a single object store
function analyzeObjectStore(db, storeName) {
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(storeName, 'readonly')
      const store = transaction.objectStore(storeName)
      const countRequest = store.count()

      let records = []
      let estimatedSize = 0

      countRequest.onsuccess = () => {
        const count = countRequest.result

        // Only get sample records if count is reasonable
        if (count > 0 && count <= 100) {
          const getAllRequest = store.getAll()
          getAllRequest.onsuccess = () => {
            records = getAllRequest.result.slice(0, 10).map((record) => {
              const str = JSON.stringify(record)
              estimatedSize += str.length
              return {
                preview: str.length > 100 ? str.substring(0, 100) + '...' : str,
                size: str.length,
              }
            })

            // Estimate total size based on sample
            if (count > 10) {
              const avgSize = estimatedSize / records.length
              estimatedSize = avgSize * count
            }

            resolve({
              name: storeName,
              count,
              keyPath: store.keyPath,
              autoIncrement: store.autoIncrement,
              indexes: Array.from(store.indexNames),
              sampleRecords: records,
              estimatedSize: Math.round(estimatedSize),
            })
          }
          getAllRequest.onerror = () => {
            resolve({
              name: storeName,
              count,
              keyPath: store.keyPath,
              autoIncrement: store.autoIncrement,
              indexes: Array.from(store.indexNames),
              estimatedSize: 0,
            })
          }
        } else if (count > 100) {
          // Too many records, just get count and estimate
          const cursorRequest = store.openCursor()
          let sampleCount = 0

          cursorRequest.onsuccess = (event) => {
            const cursor = event.target.result
            if (cursor && sampleCount < 5) {
              const str = JSON.stringify(cursor.value)
              estimatedSize += str.length
              sampleCount++
              cursor.continue()
            } else {
              const avgSize = sampleCount > 0 ? estimatedSize / sampleCount : 100
              resolve({
                name: storeName,
                count,
                keyPath: store.keyPath,
                autoIncrement: store.autoIncrement,
                indexes: Array.from(store.indexNames),
                estimatedSize: Math.round(avgSize * count),
                note: `${count} records (sampled ${sampleCount})`,
              })
            }
          }
        } else {
          resolve({
            name: storeName,
            count: 0,
            keyPath: store.keyPath,
            autoIncrement: store.autoIncrement,
            indexes: Array.from(store.indexNames),
            estimatedSize: 0,
          })
        }
      }

      countRequest.onerror = () => {
        reject(new Error('Could not count records'))
      }
    } catch (e) {
      reject(e)
    }
  })
}

// Detect database type based on name
function detectDatabaseType(name) {
  const nameLower = name.toLowerCase()

  if (nameLower.includes('firebase')) return 'firebase'
  if (nameLower.includes('localforage')) return 'localforage'
  if (nameLower.includes('sentry')) return 'sentry'
  if (nameLower.includes('workbox') || nameLower.includes('sw-')) return 'service-worker'
  if (nameLower.includes('cache')) return 'cache'
  if (nameLower.includes('fingerprint') || nameLower.includes('visitor')) return 'fingerprint'
  if (nameLower.includes('keyval')) return 'key-value'
  if (nameLower.includes('auth') || nameLower.includes('user')) return 'auth'
  if (nameLower.includes('analytics')) return 'analytics'

  return 'other'
}

// Client Hints API - high entropy device information
async function getClientHintsFingerprint() {
  if (!navigator.userAgentData) {
    return { supported: false, reason: 'userAgentData not available' }
  }

  const result = {
    supported: true,
    // Low entropy (always available)
    brands: navigator.userAgentData.brands?.map(b => `${b.brand}/${b.version}`).join(', '),
    mobile: navigator.userAgentData.mobile,
    platform: navigator.userAgentData.platform,
  }

  // High entropy (requires async call)
  try {
    const highEntropy = await navigator.userAgentData.getHighEntropyValues([
      'architecture',
      'bitness',
      'model',
      'platformVersion',
      'fullVersionList',
      'wow64',
      'formFactor',
    ])

    result.architecture = highEntropy.architecture || 'N/A'
    result.bitness = highEntropy.bitness || 'N/A'
    result.model = highEntropy.model || 'N/A'
    result.platformVersion = highEntropy.platformVersion || 'N/A'
    result.wow64 = highEntropy.wow64
    result.formFactor = highEntropy.formFactor?.join(', ') || 'N/A'
    result.fullVersionList = highEntropy.fullVersionList?.map(b => `${b.brand}/${b.version}`).join(', ')
  } catch (e) {
    result.highEntropyError = e.message
  }

  return result
}

// Enhanced WebGL Parameters - complete GPU capability fingerprint
function getWebGLParametersFingerprint() {
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')

  if (!gl) {
    return { supported: false }
  }

  const result = {
    supported: true,
    // Basic info
    version: gl.getParameter(gl.VERSION),
    shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
    vendor: gl.getParameter(gl.VENDOR),
    renderer: gl.getParameter(gl.RENDERER),

    // Debug info (unmasked)
    unmaskedVendor: null,
    unmaskedRenderer: null,

    // Texture limits
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    maxCubeMapTextureSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
    maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
    maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
    maxCombinedTextureImageUnits: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
    maxVertexTextureImageUnits: gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),

    // Vertex shader limits
    maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
    maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
    maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),

    // Fragment shader limits
    maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),

    // Viewport
    maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS)?.join('x'),
    aliasedLineWidthRange: gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE)?.join('-'),
    aliasedPointSizeRange: gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)?.join('-'),

    // Bits
    redBits: gl.getParameter(gl.RED_BITS),
    greenBits: gl.getParameter(gl.GREEN_BITS),
    blueBits: gl.getParameter(gl.BLUE_BITS),
    alphaBits: gl.getParameter(gl.ALPHA_BITS),
    depthBits: gl.getParameter(gl.DEPTH_BITS),
    stencilBits: gl.getParameter(gl.STENCIL_BITS),

    // Extensions
    extensions: gl.getSupportedExtensions()?.length || 0,
    extensionsList: gl.getSupportedExtensions()?.slice(0, 20).join(', ') + (gl.getSupportedExtensions()?.length > 20 ? '...' : ''),

    // Shader precision
    shaderPrecision: {},
  }

  // Get unmasked renderer info
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
  if (debugInfo) {
    result.unmaskedVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
    result.unmaskedRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
  }

  // Get shader precision formats
  const shaderTypes = ['VERTEX_SHADER', 'FRAGMENT_SHADER']
  const precisionTypes = ['LOW_FLOAT', 'MEDIUM_FLOAT', 'HIGH_FLOAT', 'LOW_INT', 'MEDIUM_INT', 'HIGH_INT']

  for (const shaderType of shaderTypes) {
    for (const precisionType of precisionTypes) {
      try {
        const precision = gl.getShaderPrecisionFormat(gl[shaderType], gl[precisionType])
        if (precision) {
          result.shaderPrecision[`${shaderType}_${precisionType}`] = {
            rangeMin: precision.rangeMin,
            rangeMax: precision.rangeMax,
            precision: precision.precision,
          }
        }
      } catch {
        // Ignore
      }
    }
  }

  // Hash the shader precision for compact display
  result.shaderPrecisionHash = hashCode(JSON.stringify(result.shaderPrecision))

  return result
}

// Device Sensors - accelerometer, gyroscope, orientation
async function getDeviceSensorsFingerprint() {
  const result = {
    supported: false,
    deviceMotion: false,
    deviceOrientation: false,
    accelerometer: false,
    gyroscope: false,
    magnetometer: false,
    absoluteOrientation: false,
    relativeOrientation: false,
    ambientLight: false,
    sensors: {},
  }

  // Check DeviceMotionEvent
  if (typeof DeviceMotionEvent !== 'undefined') {
    result.deviceMotion = true
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      result.deviceMotionPermissionRequired = true
    }
  }

  // Check DeviceOrientationEvent
  if (typeof DeviceOrientationEvent !== 'undefined') {
    result.deviceOrientation = true
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      result.deviceOrientationPermissionRequired = true
    }
  }

  // Check Generic Sensor API sensors
  const sensorTypes = [
    { name: 'Accelerometer', key: 'accelerometer' },
    { name: 'Gyroscope', key: 'gyroscope' },
    { name: 'Magnetometer', key: 'magnetometer' },
    { name: 'AbsoluteOrientationSensor', key: 'absoluteOrientation' },
    { name: 'RelativeOrientationSensor', key: 'relativeOrientation' },
    { name: 'AmbientLightSensor', key: 'ambientLight' },
    { name: 'LinearAccelerationSensor', key: 'linearAcceleration' },
    { name: 'GravitySensor', key: 'gravity' },
  ]

  for (const { name, key } of sensorTypes) {
    if (name in window) {
      result[key] = true
      result.supported = true

      // Try to get sensor info
      try {
        const SensorClass = window[name]
        const sensor = new SensorClass({ frequency: 1 })

        result.sensors[key] = {
          available: true,
          activated: false,
        }

        // Try to read a value (might require permission)
        await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            sensor.stop()
            resolve()
          }, 100)

          sensor.addEventListener('reading', () => {
            clearTimeout(timeout)
            result.sensors[key].activated = true
            if (sensor.x !== undefined) result.sensors[key].hasXYZ = true
            if (sensor.quaternion !== undefined) result.sensors[key].hasQuaternion = true
            if (sensor.illuminance !== undefined) result.sensors[key].hasIlluminance = true
            sensor.stop()
            resolve()
          })

          sensor.addEventListener('error', (e) => {
            clearTimeout(timeout)
            result.sensors[key].error = e.error?.name || 'unknown'
            resolve()
          })

          try {
            sensor.start()
          } catch (e) {
            clearTimeout(timeout)
            result.sensors[key].error = e.message
            resolve()
          }
        })
      } catch (e) {
        result.sensors[key] = {
          available: true,
          error: e.message,
        }
      }
    }
  }

  // Check for sensor timestamp (boot time leak)
  if (result.supported && performance.now) {
    result.performanceNowPrecision = performance.now().toString().split('.')[1]?.length || 0
  }

  return result
}

// Gamepad API fingerprint
function getGamepadFingerprint() {
  if (!navigator.getGamepads) {
    return { supported: false }
  }

  const result = {
    supported: true,
    gamepadsDetected: 0,
    gamepads: [],
  }

  try {
    const gamepads = navigator.getGamepads()
    for (const gamepad of gamepads) {
      if (gamepad) {
        result.gamepadsDetected++
        result.gamepads.push({
          id: gamepad.id,
          index: gamepad.index,
          mapping: gamepad.mapping,
          axes: gamepad.axes?.length || 0,
          buttons: gamepad.buttons?.length || 0,
          connected: gamepad.connected,
          timestamp: gamepad.timestamp,
          vibrationActuator: !!gamepad.vibrationActuator,
        })
      }
    }
  } catch (e) {
    result.error = e.message
  }

  return result
}

// Media Capabilities - hardware codec support
async function getMediaCapabilitiesFingerprint() {
  if (!navigator.mediaCapabilities) {
    return { supported: false }
  }

  const result = {
    supported: true,
    videoCodecs: {},
    audioCodecs: {},
  }

  // Test video codecs
  const videoCodecs = [
    { name: 'H.264 Baseline', contentType: 'video/mp4; codecs="avc1.42E01E"' },
    { name: 'H.264 Main', contentType: 'video/mp4; codecs="avc1.4D401E"' },
    { name: 'H.264 High', contentType: 'video/mp4; codecs="avc1.64001E"' },
    { name: 'H.265/HEVC', contentType: 'video/mp4; codecs="hvc1.1.6.L93.B0"' },
    { name: 'VP8', contentType: 'video/webm; codecs="vp8"' },
    { name: 'VP9', contentType: 'video/webm; codecs="vp9"' },
    { name: 'VP9 Profile 2', contentType: 'video/webm; codecs="vp09.02.10.10"' },
    { name: 'AV1', contentType: 'video/mp4; codecs="av01.0.01M.08"' },
  ]

  for (const codec of videoCodecs) {
    try {
      const config = {
        type: 'file',
        video: {
          contentType: codec.contentType,
          width: 1920,
          height: 1080,
          bitrate: 5000000,
          framerate: 30,
        },
      }
      const info = await navigator.mediaCapabilities.decodingInfo(config)
      result.videoCodecs[codec.name] = {
        supported: info.supported,
        smooth: info.smooth,
        powerEfficient: info.powerEfficient,
      }
    } catch {
      result.videoCodecs[codec.name] = { supported: false, error: true }
    }
  }

  // Test audio codecs
  const audioCodecs = [
    { name: 'AAC', contentType: 'audio/mp4; codecs="mp4a.40.2"' },
    { name: 'Opus', contentType: 'audio/webm; codecs="opus"' },
    { name: 'Vorbis', contentType: 'audio/webm; codecs="vorbis"' },
    { name: 'FLAC', contentType: 'audio/flac' },
    { name: 'MP3', contentType: 'audio/mpeg' },
  ]

  for (const codec of audioCodecs) {
    try {
      const config = {
        type: 'file',
        audio: {
          contentType: codec.contentType,
          channels: 2,
          bitrate: 128000,
          samplerate: 48000,
        },
      }
      const info = await navigator.mediaCapabilities.decodingInfo(config)
      result.audioCodecs[codec.name] = {
        supported: info.supported,
        smooth: info.smooth,
        powerEfficient: info.powerEfficient,
      }
    } catch {
      result.audioCodecs[codec.name] = { supported: false, error: true }
    }
  }

  // Count supported codecs
  result.supportedVideoCodecs = Object.values(result.videoCodecs).filter(c => c.supported).length
  result.supportedAudioCodecs = Object.values(result.audioCodecs).filter(c => c.supported).length
  result.hardwareAcceleratedVideo = Object.values(result.videoCodecs).filter(c => c.powerEfficient).length

  return result
}

// Extended Screen Properties
function getExtendedScreenFingerprint() {
  const result = {
    // Basic screen (already collected but included for completeness)
    width: screen.width,
    height: screen.height,
    availWidth: screen.availWidth,
    availHeight: screen.availHeight,
    colorDepth: screen.colorDepth,
    pixelDepth: screen.pixelDepth,

    // Window properties
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    outerWidth: window.outerWidth,
    outerHeight: window.outerHeight,

    // Window position
    screenX: window.screenX,
    screenY: window.screenY,
    screenLeft: window.screenLeft,
    screenTop: window.screenTop,

    // Device pixel ratio
    devicePixelRatio: window.devicePixelRatio,

    // Orientation
    orientationType: screen.orientation?.type || 'N/A',
    orientationAngle: screen.orientation?.angle ?? 'N/A',

    // Multi-monitor detection
    isExtended: screen.isExtended ?? 'N/A',

    // Visual viewport (if available)
    visualViewport: null,

    // CSS media queries
    prefersColorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    prefersContrast: window.matchMedia('(prefers-contrast: more)').matches ? 'more' : 'normal',
    forcedColors: window.matchMedia('(forced-colors: active)').matches,
    prefersReducedTransparency: window.matchMedia('(prefers-reduced-transparency: reduce)').matches,

    // Display mode
    displayMode: 'browser',

    // HDR support
    hdrSupported: window.matchMedia('(dynamic-range: high)').matches,

    // Pointer capabilities
    anyPointer: window.matchMedia('(any-pointer: fine)').matches ? 'fine' :
                window.matchMedia('(any-pointer: coarse)').matches ? 'coarse' : 'none',
    anyHover: window.matchMedia('(any-hover: hover)').matches,
  }

  // Visual viewport
  if (window.visualViewport) {
    result.visualViewport = {
      width: window.visualViewport.width,
      height: window.visualViewport.height,
      offsetLeft: window.visualViewport.offsetLeft,
      offsetTop: window.visualViewport.offsetTop,
      scale: window.visualViewport.scale,
    }
  }

  // Display mode detection
  if (window.matchMedia('(display-mode: fullscreen)').matches) {
    result.displayMode = 'fullscreen'
  } else if (window.matchMedia('(display-mode: standalone)').matches) {
    result.displayMode = 'standalone'
  } else if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    result.displayMode = 'minimal-ui'
  }

  return result
}

// Performance Memory fingerprint
function getPerformanceMemoryFingerprint() {
  const result = {
    supported: false,
  }

  // Chrome-only memory info
  if (performance.memory) {
    result.supported = true
    result.jsHeapSizeLimit = performance.memory.jsHeapSizeLimit
    result.jsHeapSizeLimitMB = Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
    result.totalJSHeapSize = performance.memory.totalJSHeapSize
    result.totalJSHeapSizeMB = Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
    result.usedJSHeapSize = performance.memory.usedJSHeapSize
    result.usedJSHeapSizeMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)
  }

  // Device memory (also available separately)
  if (navigator.deviceMemory) {
    result.deviceMemory = navigator.deviceMemory
  }

  // Hardware concurrency
  if (navigator.hardwareConcurrency) {
    result.hardwareConcurrency = navigator.hardwareConcurrency
  }

  // Performance timing precision
  result.performanceNowPrecision = getPerformanceNowPrecision()

  return result
}

// Get performance.now() precision (can indicate browser/OS)
function getPerformanceNowPrecision() {
  const samples = []
  for (let i = 0; i < 100; i++) {
    const t = performance.now()
    const decimal = t.toString().split('.')[1] || ''
    samples.push(decimal.length)
  }
  return Math.max(...samples)
}

// Permissions API fingerprint
async function getPermissionsFingerprint() {
  if (!navigator.permissions) {
    return { supported: false }
  }

  const result = {
    supported: true,
    permissions: {},
  }

  const permissionNames = [
    'geolocation',
    'notifications',
    'push',
    'midi',
    'camera',
    'microphone',
    'speaker-selection',
    'device-info',
    'background-fetch',
    'background-sync',
    'bluetooth',
    'persistent-storage',
    'ambient-light-sensor',
    'accelerometer',
    'gyroscope',
    'magnetometer',
    'clipboard-read',
    'clipboard-write',
    'screen-wake-lock',
    'nfc',
    'display-capture',
    'idle-detection',
  ]

  for (const name of permissionNames) {
    try {
      const status = await navigator.permissions.query({ name })
      result.permissions[name] = status.state
    } catch {
      result.permissions[name] = 'not-supported'
    }
  }

  // Count by state
  const states = Object.values(result.permissions)
  result.granted = states.filter(s => s === 'granted').length
  result.denied = states.filter(s => s === 'denied').length
  result.prompt = states.filter(s => s === 'prompt').length
  result.notSupported = states.filter(s => s === 'not-supported').length

  return result
}
