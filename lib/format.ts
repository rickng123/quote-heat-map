export function formatPrice(value: number, currency = 'USD', isIndex = false) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...(isIndex || !currency ? {} : { style: 'currency', currency }),
  }).format(value)
}

export function formatSigned(value: number, digits = 2) {
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`
}

export function formatPercent(value: number) {
  return `${formatSigned(value)}%`
}

export function formatCompact(value: number) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(value)
}

const HEAT_SATURATION_PCT = 3

export function heatColor(changePercent: number) {
  const intensity = Math.min(Math.abs(changePercent) / HEAT_SATURATION_PCT, 1)
  const mix = Math.round(18 + intensity * 82)
  if (Math.abs(changePercent) < 0.01) return 'var(--tile)'
  const hue = changePercent > 0 ? 'var(--gain)' : 'var(--loss)'
  return `color-mix(in oklch, ${hue} ${mix}%, var(--tile))`
}
