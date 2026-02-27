// GET /api/stats - Get overall fingerprint statistics
export async function onRequestGet(context) {
  const { env } = context

  try {
    // Get total visitors
    const totalVisitors = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM visitors'
    ).first()

    // Get total visits
    const totalVisits = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM visits'
    ).first()

    // Get visitors with multiple visits (returning visitors)
    const returningVisitors = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM visitors WHERE visit_count > 1'
    ).first()

    // Get visits in last 24 hours
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000)
    const recentVisits = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM visits WHERE timestamp > ?'
    ).bind(oneDayAgo).first()

    // Get average visits per visitor
    const avgVisits = await env.DB.prepare(
      'SELECT AVG(visit_count) as avg FROM visitors'
    ).first()

    // Get most recent visits
    const latestVisits = await env.DB.prepare(
      'SELECT v.*, vis.visit_count FROM visits v JOIN visitors vis ON v.visitor_id = vis.id ORDER BY v.timestamp DESC LIMIT 10'
    ).all()

    return Response.json({
      totalVisitors: totalVisitors?.count || 0,
      totalVisits: totalVisits?.count || 0,
      returningVisitors: returningVisitors?.count || 0,
      returningRate: totalVisitors?.count > 0
        ? Math.round((returningVisitors?.count / totalVisitors?.count) * 100)
        : 0,
      visitsLast24h: recentVisits?.count || 0,
      avgVisitsPerVisitor: avgVisits?.avg ? Math.round(avgVisits.avg * 10) / 10 : 0,
      latestVisits: (latestVisits.results || []).map(v => ({
        fingerprint: v.fingerprint.slice(0, 8) + '...',
        timestamp: v.timestamp,
        visitCount: v.visit_count,
        userAgent: v.user_agent?.slice(0, 50) || 'Unknown',
      })),
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
