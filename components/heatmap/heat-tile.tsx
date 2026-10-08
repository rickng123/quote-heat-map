'use client'

import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPercent, formatPrice, heatColor } from '@/lib/format'
import type { QuoteResult } from '@/lib/quotes'

type HeatTileProps = {
  result: QuoteResult | undefined
  symbol: string
  selected: boolean
  onSelect: () => void
  onRemove: () => void
}

export function HeatTile({ result, symbol, selected, onSelect, onRemove }: HeatTileProps) {
  const quote = result?.quote
  const loading = !result
  const background = quote ? heatColor(quote.changePercent) : 'var(--tile)'

  return (
    <li className="group relative">
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={
          quote
            ? `${symbol}, ${formatPrice(quote.price, quote.currency, quote.instrumentType === 'INDEX')}, ${formatPercent(quote.changePercent)} today`
            : `${symbol}, ${loading ? 'loading' : 'unavailable'}`
        }
        style={{ backgroundColor: background }}
        className={cn(
          'flex aspect-[4/3] w-full flex-col justify-between rounded-md p-3 text-left text-foreground transition-[background-color,box-shadow,transform] duration-500 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground',
          selected && 'ring-2 ring-foreground ring-offset-2 ring-offset-background',
          loading && 'animate-pulse',
        )}
      >
        <span className="font-mono text-base font-semibold tracking-wide sm:text-lg">{symbol}</span>
        {quote ? (
          <span className="flex flex-col gap-0.5">
            <span className="font-mono text-xl font-semibold tabular-nums sm:text-2xl">
              {formatPercent(quote.changePercent)}
            </span>
            <span className="font-mono text-xs tabular-nums opacity-80 sm:text-sm">
              {formatPrice(quote.price, quote.currency, quote.instrumentType === 'INDEX')}
            </span>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">{loading ? 'Loading…' : (result?.error ?? 'Unavailable')}</span>
        )}
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${symbol}`}
        className="absolute right-1.5 top-1.5 rounded-sm p-1 text-foreground/70 opacity-100 transition-opacity hover:bg-background/30 hover:text-foreground focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-foreground sm:opacity-0 sm:group-hover:opacity-100"
      >
        <X className="size-4" aria-hidden />
      </button>
    </li>
  )
}
