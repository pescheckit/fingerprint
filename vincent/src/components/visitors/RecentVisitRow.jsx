import { useState, useEffect } from 'react'
import { formatTimeSince } from '../../utils/formatters'

export function RecentVisitRow({ visit }) {
  const [timeAgo, setTimeAgo] = useState('')

  useEffect(() => {
    const updateTime = () => {
      setTimeAgo(formatTimeSince(Date.now() - visit.timestamp))
    }
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [visit.timestamp])

  return (
    <div className="recent-visit">
      <span className="visit-fp">{visit.fingerprint}</span>
      <span className="visit-count">Visit #{visit.visitCount}</span>
      <span className="visit-time">{timeAgo} ago</span>
    </div>
  )
}
