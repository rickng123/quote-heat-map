'use client'

import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { normalizeTicker, type QuoteResult } from '@/lib/quotes'

type TickerFormProps = {
  existing: string[]
  atLimit: boolean
  onAdd: (ticker: string) => void
}

export function TickerForm({ existing, atLimit, onAdd }: TickerFormProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const ticker = normalizeTicker(value)
    if (!ticker) {
      setError('Enter a valid ticker, like TSLA or SPX.')
      return
    }
    if (existing.includes(ticker)) {
      setError(`${ticker} is already on the map.`)
      return
    }
    if (atLimit) {
      setError('The heatmap is full. Remove a ticker first.')
      return
    }

    setPending(true)
    setError(null)
    try {
      const res = await fetch(`/api/quotes?symbols=${encodeURIComponent(ticker)}`)
      const { results } = (await res.json()) as { results: QuoteResult[] }
      const result = results[0]
      if (!result?.quote) {
        setError(`Couldn't find "${ticker}". Check the symbol and try again.`)
        return
      }
      onAdd(ticker)
      setValue('')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2 sm:w-auto" noValidate>
      <div className="flex gap-2">
        <label htmlFor="ticker-input" className="sr-only">
          Ticker symbol
        </label>
        <input
          id="ticker-input"
          value={value}
          onChange={(e) => {
            setValue(e.target.value.toUpperCase())
            if (error) setError(null)
          }}
          placeholder="Add ticker — TSLA, SPX…"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={12}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'ticker-error' : undefined}
          className="h-10 w-full min-w-0 rounded-md border border-input bg-card px-3 font-mono text-sm tracking-wide text-foreground placeholder:font-sans placeholder:tracking-normal placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring sm:w-64"
        />
        <Button type="submit" disabled={pending} className="h-10 gap-1.5 px-4">
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Plus className="size-4" aria-hidden />}
          Add
        </Button>
      </div>
      <p id="ticker-error" role="alert" className="min-h-5 text-sm text-loss">
        {error}
      </p>
    </form>
  )
}
