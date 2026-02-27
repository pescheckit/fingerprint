export function StabilityBadge({ score, small }) {
  if (score === undefined) return null

  let className = 'stability-badge'
  if (small) className += ' small'

  if (score === 100) {
    className += ' stable'
  } else if (score >= 80) {
    className += ' mostly-stable'
  } else if (score >= 50) {
    className += ' unstable'
  } else {
    className += ' volatile'
  }

  return <span className={className}>{Math.round(score)}%</span>
}
