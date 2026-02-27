import { formatValue } from '../../utils/formatters'
import { StabilityBadge } from '../common/StabilityBadge'

export function SignalCard({ title, icon, data, stability, expanded, onToggle }) {
  if (!data) return null

  const entries = Object.entries(data)
  const preview = entries.slice(0, 2)
  const hasMore = entries.length > 2

  return (
    <div className={`signal-card ${expanded ? 'expanded' : ''}`}>
      <div className="signal-header" onClick={onToggle}>
        <span className="signal-icon">{icon}</span>
        <span className="signal-title">{title}</span>
        {hasMore && (
          <span className="signal-expand">{expanded ? '−' : '+'}</span>
        )}
      </div>
      <div className="signal-content">
        {(expanded ? entries : preview).map(([key, value]) => (
          <div key={key} className="signal-row">
            <span className="signal-key">{key}:</span>
            <span className="signal-value">{formatValue(value)}</span>
            {stability && stability[key] && (
              <StabilityBadge score={stability[key].consistency} small />
            )}
          </div>
        ))}
        {!expanded && hasMore && (
          <div className="signal-more">+{entries.length - 2} more</div>
        )}
      </div>
    </div>
  )
}
