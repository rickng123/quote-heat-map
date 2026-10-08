import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCompact, formatPercent, formatPrice, formatSigned } from '@/lib/format'
import type { Quote } from '@/lib/quotes'

function Sparkline({ points, baseline, positive }: { points: number[]; baseline: number; positive: boolean }) {
  if (points.length < 2) {
    return (
      <div className="flex h-28 items-center justify-center rounded-md bg-background/40 text-sm text-muted-foreground">
        No intraday data yet
      </div>
    )
  }
  const width = 300
  const height = 112
  const min = Math.min(...points, baseline)
  const max = Math.max(...points, baseline)
  const range = max - min || 1
  const x = (i: number) => (i / (points.length - 1)) * width
  const y = (v: number) => height - ((v - min) / range) * (height - 8) - 4
  const path = points.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const stroke = positive ? 'var(--gain)' : 'var(--loss)'

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="h-28 w-full"
      role="img"
      aria-label="Intraday price chart against previous close"
    >
      <line
        x1={0}
        x2={width}
        y1={y(baseline)}
        y2={y(baseline)}
        stroke="var(--muted-foreground)"
        strokeDasharray="3 4"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
      <path d={`${path} L${width},${height} L0,${height} Z`} fill={stroke} opacity={0.12} />
      <path d={path} fill="none" stroke={stroke} strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="font-mono text-sm tabular-nums text-foreground">{value}</dd>
    </div>
  )
}

export function QuoteDetail({ quote }: { quote: Quote }) {
  const isIndex = quote.instrumentType === 'INDEX'
  const price = (v: number) => formatPrice(v, quote.currency, isIndex)
  const positive = quote.change >= 0
  const Arrow = positive ? ArrowUpRight : ArrowDownRight
  const updated = quote.marketTime
    ? new Date(quote.marketTime).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '—'

  return (
    <article className="flex flex-col gap-5" aria-live="polite">
      <header className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-mono text-2xl font-semibold tracking-wide">{quote.symbol}</h2>
          <span className="truncate text-xs text-muted-foreground">
            {quote.exchange}
            {quote.sourceSymbol !== quote.symbol ? ` · ${quote.sourceSymbol}` : ''}
          </span>
        </div>
        <p className="truncate text-sm text-muted-foreground">{quote.name}</p>
      </header>

      <div className="flex flex-col gap-1">
        <p className="font-mono text-4xl font-semibold tabular-nums">{price(quote.price)}</p>
        <p className={cn('flex items-center gap-1 font-mono text-base tabular-nums', positive ? 'text-gain' : 'text-loss')}>
          <Arrow className="size-4" aria-hidden />
          {formatSigned(quote.change)} ({formatPercent(quote.changePercent)})
          <span className="ml-1 font-sans text-xs text-muted-foreground">today</span>
        </p>
      </div>

      <Sparkline points={quote.intraday} baseline={quote.previousClose} positive={positive} />

      <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
        <Stat label="Prev close" value={price(quote.previousClose)} />
        <Stat label="Volume" value={quote.volume ? formatCompact(quote.volume) : '—'} />
        <Stat
          label="Day range"
          value={quote.dayLow != null && quote.dayHigh != null ? `${price(quote.dayLow)} – ${price(quote.dayHigh)}` : '—'}
        />
        <Stat
          label="52-wk range"
          value={
            quote.fiftyTwoWeekLow != null && quote.fiftyTwoWeekHigh != null
              ? `${price(quote.fiftyTwoWeekLow)} – ${price(quote.fiftyTwoWeekHigh)}`
              : '—'
          }
        />
      </dl>

      <p className="text-xs text-muted-foreground">Last trade {updated}</p>
    </article>
  )
}
