export function formatValue(value) {
  if (value === true) return 'Yes'
  if (value === false) return 'No'
  if (value === null || value === undefined) return 'N/A'
  if (typeof value === 'number') return value.toLocaleString()
  return String(value)
}

export function formatComponentValue(value) {
  if (value === undefined || value === null) return 'N/A'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return value.toLocaleString()
  if (Array.isArray(value)) {
    if (value.length === 0) return '(empty)'
    if (value.length <= 3) return value.join(', ')
    return `${value.slice(0, 3).join(', ')} (+${value.length - 3} more)`
  }
  if (typeof value === 'object') {
    return JSON.stringify(value).slice(0, 50) + '...'
  }
  const str = String(value)
  return str.length > 60 ? str.slice(0, 60) + '...' : str
}

export function formatTimeSince(ms) {
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds} seconds`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''}`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''}`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''}`
}
