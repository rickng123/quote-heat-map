export type Quote = {
  symbol: string
  sourceSymbol: string
  name: string
  currency: string
  exchange: string
  instrumentType: string
  price: number
  previousClose: number
  change: number
  changePercent: number
  dayHigh: number | null
  dayLow: number | null
  fiftyTwoWeekHigh: number | null
  fiftyTwoWeekLow: number | null
  volume: number | null
  marketTime: number
  intraday: number[]
}

export type QuoteResult = { symbol: string; quote: Quote | null; error: string | null }

export const INDEX_ALIASES: Record<string, string> = {
  SPX: '^GSPC',
  SPY500: '^GSPC',
  NDX: '^NDX',
  COMP: '^IXIC',
  IXIC: '^IXIC',
  DJI: '^DJI',
  DJIA: '^DJI',
  RUT: '^RUT',
  VIX: '^VIX',
}

export const DEFAULT_TICKERS = ['SPX', 'NDX', 'TSLA', 'AAPL', 'NVDA', 'MSFT', 'AMZN', 'META']

export const MAX_TICKERS = 40

const TICKER_PATTERN = /^\^?[A-Z0-9.\-=]{1,12}$/

export function normalizeTicker(raw: string): string | null {
  const value = raw.trim().toUpperCase().replace(/^\$/, '')
  return TICKER_PATTERN.test(value) ? value : null
}

export function toSourceSymbol(ticker: string): string {
  return INDEX_ALIASES[ticker] ?? ticker
}

export function parseTickerList(value: string | null | undefined): string[] {
  if (!value) return []
  const seen = new Set<string>()
  for (const part of value.split(',')) {
    const ticker = normalizeTicker(part)
    if (ticker) seen.add(ticker)
  }
  return [...seen].slice(0, MAX_TICKERS)
}
