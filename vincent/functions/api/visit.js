// POST /api/visit - Record a new visit
export async function onRequestPost(context) {
  const { request, env } = context

  try {
    const body = await request.json()
    const { fingerprint, components, signals, page } = body

    if (!fingerprint || !components) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const timestamp = Date.now()
    const userAgent = request.headers.get('User-Agent') || ''
    const referrer = request.headers.get('Referer') || page?.referrer || ''

    // Hash the IP for privacy
    const ip = request.headers.get('CF-Connecting-IP') || ''
    const ipHash = ip ? await hashString(ip) : null

    // Check if visitor exists
    let visitor = await env.DB.prepare(
      'SELECT id, visit_count FROM visitors WHERE fingerprint = ?'
    ).bind(fingerprint).first()

    let visitorId
    let isReturning = false
    let previousVisits = []

    if (visitor) {
      visitorId = visitor.id
      isReturning = true

      await env.DB.prepare(
        'UPDATE visitors SET last_seen_at = ?, visit_count = visit_count + 1 WHERE id = ?'
      ).bind(timestamp, visitorId).run()

      // Get previous visits for comparison
      const visits = await env.DB.prepare(
        'SELECT * FROM visits WHERE visitor_id = ? ORDER BY timestamp DESC LIMIT 10'
      ).bind(visitorId).all()

      previousVisits = visits.results || []
    } else {
      // Create new visitor
      const result = await env.DB.prepare(
        'INSERT INTO visitors (fingerprint, first_seen_at, last_seen_at, visit_count) VALUES (?, ?, ?, 1)'
      ).bind(fingerprint, timestamp, timestamp).run()

      visitorId = result.meta.last_row_id
    }

    // Record the visit with page info
    await env.DB.prepare(
      `INSERT INTO visits (visitor_id, fingerprint, timestamp, components, signals, user_agent, ip_hash, page_url, page_title, referrer)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      visitorId,
      fingerprint,
      timestamp,
      JSON.stringify(components),
      signals ? JSON.stringify(signals) : null,
      userAgent,
      ipHash,
      page?.url || null,
      page?.title || null,
      referrer
    ).run()

    // Update or insert page tracking
    if (page?.url) {
      const existingPage = await env.DB.prepare(
        'SELECT id FROM visitor_pages WHERE visitor_id = ? AND page_url = ?'
      ).bind(visitorId, page.url).first()

      if (existingPage) {
        await env.DB.prepare(
          'UPDATE visitor_pages SET last_visit_at = ?, visit_count = visit_count + 1 WHERE id = ?'
        ).bind(timestamp, existingPage.id).run()
      } else {
        await env.DB.prepare(
          'INSERT INTO visitor_pages (visitor_id, page_url, page_title, first_visit_at, last_visit_at, visit_count) VALUES (?, ?, ?, ?, ?, 1)'
        ).bind(visitorId, page.url, page.title, timestamp, timestamp).run()
      }
    }

    // Get updated visitor info
    const updatedVisitor = await env.DB.prepare(
      'SELECT * FROM visitors WHERE id = ?'
    ).bind(visitorId).first()

    // Get visited pages for this visitor
    const visitedPages = await env.DB.prepare(
      'SELECT * FROM visitor_pages WHERE visitor_id = ? ORDER BY last_visit_at DESC'
    ).bind(visitorId).all()

    // Calculate comparison and stability if returning
    let comparison = null
    let stabilityScore = null

    if (previousVisits.length > 0) {
      const lastVisit = previousVisits[0]
      comparison = compareVisits(
        {
          timestamp: lastVisit.timestamp,
          fingerprint: lastVisit.fingerprint,
          components: JSON.parse(lastVisit.components),
          signals: lastVisit.signals ? JSON.parse(lastVisit.signals) : null,
        },
        { timestamp, fingerprint, components, signals }
      )

      stabilityScore = calculateStability(
        previousVisits.map(v => ({
          timestamp: v.timestamp,
          fingerprint: v.fingerprint,
          components: JSON.parse(v.components),
          signals: v.signals ? JSON.parse(v.signals) : null,
        })),
        { timestamp, fingerprint, components, signals }
      )
    }

    return Response.json({
      success: true,
      visitor: {
        id: visitorId,
        fingerprint: updatedVisitor.fingerprint,
        firstSeenAt: updatedVisitor.first_seen_at,
        lastSeenAt: updatedVisitor.last_seen_at,
        visitCount: updatedVisitor.visit_count,
      },
      visitedPages: (visitedPages.results || []).map(p => ({
        url: p.page_url,
        title: p.page_title,
        firstVisitAt: p.first_visit_at,
        lastVisitAt: p.last_visit_at,
        visitCount: p.visit_count,
      })),
      isReturning,
      comparison,
      stabilityScore,
    })
  } catch (error) {
    console.error('Error recording visit:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

async function hashString(str) {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16)
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
      const categorySignals = currentVisit.signals[category]
      if (!categorySignals) continue

      for (const key of Object.keys(categorySignals)) {
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
  const overallComponent = componentScores.length > 0
    ? componentScores.reduce((a, b) => a + b, 0) / componentScores.length
    : 100

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
