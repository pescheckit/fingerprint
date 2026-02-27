import { formatValue } from '../../utils/formatters'
import { StabilityBadge } from '../common/StabilityBadge'

export function SignalCard({ title, icon, data, stability, expanded, onToggle }) {
  if (!data) return null

  const entries = Object.entries(data)
  const preview = entries.slice(0, 2)
  const hasMore = entries.length > 2
  const hiddenEntries = entries.slice(2)
  const hiddenKeys = hiddenEntries.map(([key]) => key).join(', ')

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
          <div
            className="signal-more"
            onClick={(e) => {
              e.stopPropagation()
              onToggle()
            }}
            title={hiddenKeys}
          >
            <span className="signal-more-text">+{entries.length - 2} more</span>
            <span className="signal-more-tooltip">{hiddenKeys}</span>
          </div>
        )}
        {expanded && hasMore && (
          <div
            className="signal-less"
            onClick={(e) => {
              e.stopPropagation()
              onToggle()
            }}
          >
            <span className="signal-less-text">Show less</span>
          </div>
        )}
      </div>
    </div>
  )
}
