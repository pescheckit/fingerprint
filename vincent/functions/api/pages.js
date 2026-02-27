// GET /api/pages?fingerprint=xxx - Get all pages for a visitor
export async function onRequestGet(context) {
  const { request, env } = context

  try {
    const url = new URL(request.url)
    const fingerprint = url.searchParams.get('fingerprint')

    if (!fingerprint) {
      return Response.json({ error: 'Missing fingerprint parameter' }, { status: 400 })
    }

    // Find the visitor
    const visitor = await env.DB.prepare(
      'SELECT id FROM visitors WHERE fingerprint = ?'
    ).bind(fingerprint).first()

    if (!visitor) {
      return Response.json({ pages: [], totalVisits: 0 })
    }

    // Get all pages for this visitor
    const pages = await env.DB.prepare(
      'SELECT * FROM visitor_pages WHERE visitor_id = ? ORDER BY last_visit_at DESC'
    ).bind(visitor.id).all()

    // Get total visit count for this visitor
    const visitCount = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM visits WHERE visitor_id = ?'
    ).bind(visitor.id).first()

    return Response.json({
      pages: (pages.results || []).map(p => ({
        id: p.id,
        url: p.page_url,
        path: extractPath(p.page_url),
        title: p.page_title,
        firstVisitAt: p.first_visit_at,
        lastVisitAt: p.last_visit_at,
        visitCount: p.visit_count,
      })),
      totalVisits: visitCount?.count || 0,
      visitorId: visitor.id,
    })
  } catch (error) {
    console.error('Error fetching pages:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/pages - Record a page visit (lightweight, just page tracking)
export async function onRequestPost(context) {
  const { request, env } = context

  try {
    const body = await request.json()
    const { fingerprint, page } = body

    if (!fingerprint || !page?.url) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const timestamp = Date.now()

    // Find or create visitor
    let visitor = await env.DB.prepare(
      'SELECT id FROM visitors WHERE fingerprint = ?'
    ).bind(fingerprint).first()

    if (!visitor) {
      // Create minimal visitor record
      const result = await env.DB.prepare(
        'INSERT INTO visitors (fingerprint, first_seen_at, last_seen_at, visit_count) VALUES (?, ?, ?, 1)'
      ).bind(fingerprint, timestamp, timestamp).run()
      visitor = { id: result.meta.last_row_id }
    } else {
      // Update last seen
      await env.DB.prepare(
        'UPDATE visitors SET last_seen_at = ? WHERE id = ?'
      ).bind(timestamp, visitor.id).run()
    }

    // Update or insert page tracking
    const existingPage = await env.DB.prepare(
      'SELECT id FROM visitor_pages WHERE visitor_id = ? AND page_url = ?'
    ).bind(visitor.id, page.url).first()

    if (existingPage) {
      await env.DB.prepare(
        'UPDATE visitor_pages SET last_visit_at = ?, page_title = ?, visit_count = visit_count + 1 WHERE id = ?'
      ).bind(timestamp, page.title || null, existingPage.id).run()
    } else {
      await env.DB.prepare(
        'INSERT INTO visitor_pages (visitor_id, page_url, page_title, first_visit_at, last_visit_at, visit_count) VALUES (?, ?, ?, ?, ?, 1)'
      ).bind(visitor.id, page.url, page.title || null, timestamp, timestamp).run()
    }

    // Return updated pages list
    const pages = await env.DB.prepare(
      'SELECT * FROM visitor_pages WHERE visitor_id = ? ORDER BY last_visit_at DESC'
    ).bind(visitor.id).all()

    return Response.json({
      success: true,
      pages: (pages.results || []).map(p => ({
        id: p.id,
        url: p.page_url,
        path: extractPath(p.page_url),
        title: p.page_title,
        firstVisitAt: p.first_visit_at,
        lastVisitAt: p.last_visit_at,
        visitCount: p.visit_count,
      })),
    })
  } catch (error) {
    console.error('Error recording page:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

function extractPath(url) {
  try {
    return new URL(url).pathname
  } catch {
    return url
  }
}
