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
