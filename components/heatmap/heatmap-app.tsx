'use client'

import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { heatColor } from '@/lib/format'
import { MAX_TICKERS, type QuoteResult } from '@/lib/quotes'
import { TickerForm } from './ticker-form'
import { HeatTile } from './heat-tile'
import { QuoteDetail } from './quote-detail'

type SortMode = 'added' | 'gainers' | 'losers'

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'added', label: 'Added' },
  { value: 'gainers', label: 'Gainers' },
  { value: 'losers', label: 'Losers' },
]

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Failed to load quotes')
    return r.json() as Promise<{ results: QuoteResult[] }>
  })

function syncUrl(tickers: string[]) {
  const url = new URL(window.location.href)
  if (tickers.length) url.searchParams.set('t', tickers.join(','))
  else url.searchParams.delete('t')
  window.history.replaceState(null, '', url)
}

export function HeatmapApp({
  initialTickers,
  fallbackTickers,
}: {
  initialTickers: string[]
  fallbackTickers: string[]
}) {
  const [tickers, setTickers] = useState(initialTickers)
  const [selected, setSelected] = useState<string | null>(initialTickers[0] ?? null)
  const [sort, setSort] = useState<SortMode>('added')

  useEffect(() => {
    if (initialTickers.length > 0) return

    try {
      const saved = window.localStorage.getItem('ticker-heatmap-symbols')
      const savedTickers = (saved ? saved.split(',').filter(Boolean) : fallbackTickers).slice(0, MAX_TICKERS)
      if (savedTickers.length > 0) {
        setTickers(savedTickers)
        setSelected(savedTickers[0])
        syncUrl(savedTickers)
      }
    } catch {
      // Storage can be unavailable in privacy-restricted browser contexts.
    }
  }, [fallbackTickers, initialTickers])

  useEffect(() => {
    try {
      if (tickers.length > 0) window.localStorage.setItem('ticker-heatmap-symbols', tickers.join(','))
      else window.localStorage.removeItem('ticker-heatmap-symbols')
    } catch {
      // Storage can be unavailable in privacy-restricted browser contexts.
    }
  }, [tickers])

  const key = tickers.length ? `/api/quotes?symbols=${encodeURIComponent(tickers.join(','))}` : null
  const { data, isValidating, mutate } = useSWR(key, fetcher, {
    refreshInterval: 30_000,
    keepPreviousData: true,
  })

  const bySymbol = useMemo(() => new Map(data?.results.map((r) => [r.symbol, r]) ?? []), [data])

  const ordered = useMemo(() => {
    if (sort === 'added') return tickers
    const pct = (s: string) => bySymbol.get(s)?.quote?.changePercent ?? 0
    return [...tickers].sort((a, b) => (sort === 'gainers' ? pct(b) - pct(a) : pct(a) - pct(b)))
  }, [tickers, sort, bySymbol])

  const advancers = tickers.filter((t) => (bySymbol.get(t)?.quote?.change ?? 0) > 0).length
  const decliners = tickers.filter((t) => (bySymbol.get(t)?.quote?.change ?? 0) < 0).length

  function updateTickers(next: string[]) {
    setTickers(next)
    syncUrl(next)
  }

  function addTicker(ticker: string) {
    updateTickers([...tickers, ticker])
    setSelected(ticker)
  }

  function removeTicker(ticker: string) {
    const next = tickers.filter((t) => t !== ticker)
    updateTickers(next)
    if (selected === ticker) setSelected(next[0] ?? null)
  }

  const selectedQuote = selected ? bySymbol.get(selected)?.quote : null

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">Ticker Heatmap</h1>
          <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
            Daily moves for every symbol you track. Tiles deepen in color as the move grows.
          </p>
        </div>
        <TickerForm existing={tickers} atLimit={tickers.length >= MAX_TICKERS} onAdd={addTicker} />
      </header>

      <div className="flex flex-col gap-3 border-y py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 font-mono text-sm tabular-nums">
          <span className="text-muted-foreground">
            <span className="text-foreground">{tickers.length}</span> tracked
          </span>
          <span className="text-gain">{advancers} up</span>
          <span className="text-loss">{decliners} down</span>
          <button
            type="button"
            onClick={() => mutate()}
            className="flex items-center gap-1.5 rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            aria-label="Refresh quotes"
          >
            <RefreshCw className={cn('size-3.5', isValidating && 'animate-spin')} aria-hidden />
            <span className="hidden font-sans text-xs sm:inline">Auto-refresh 30s</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2" aria-hidden>
            <span className="font-mono text-xs text-muted-foreground">−3%</span>
            <div className="flex h-2.5 w-32 overflow-hidden rounded-sm">
              {[-3, -2, -1, -0.3, 0, 0.3, 1, 2, 3].map((v) => (
                <span key={v} className="flex-1" style={{ backgroundColor: heatColor(v) }} />
              ))}
            </div>
            <span className="font-mono text-xs text-muted-foreground">+3%</span>
          </div>

          <div role="radiogroup" aria-label="Sort tiles" className="flex rounded-md border p-0.5">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={sort === opt.value}
                onClick={() => setSort(opt.value)}
                className={cn(
                  'rounded-sm px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring',
                  sort === opt.value ? 'bg-tile text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <section aria-label="Heatmap" className="min-w-0 flex-1">
          {tickers.length === 0 ? (
            <div className="flex aspect-[16/7] flex-col items-center justify-center gap-2 rounded-md border border-dashed text-center">
              <p className="font-medium">Your heatmap is empty</p>
              <p className="text-sm text-muted-foreground">Add a ticker above, like TSLA or SPX.</p>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {ordered.map((symbol) => (
                <HeatTile
                  key={symbol}
                  symbol={symbol}
                  result={bySymbol.get(symbol)}
                  selected={selected === symbol}
                  onSelect={() => setSelected(symbol)}
                  onRemove={() => removeTicker(symbol)}
                />
              ))}
            </ul>
          )}
        </section>

        <aside
          aria-label="Ticker details"
          className="w-full shrink-0 rounded-md border bg-card p-5 lg:sticky lg:top-6 lg:w-80"
        >
          {selectedQuote ? (
            <QuoteDetail quote={selectedQuote} />
          ) : (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {selected && !bySymbol.get(selected) ? 'Loading details…' : 'Select a tile to see its price details.'}
            </p>
          )}
        </aside>
      </div>

      <footer className="mt-auto text-xs text-muted-foreground">
        Quotes may be delayed. SPX, NDX, DJI, RUT and VIX map to their index symbols. Your ticker list is saved in this browser.
      </footer>
    </main>
  )
}
