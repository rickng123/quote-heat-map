import { NextResponse, type NextRequest } from 'next/server'
import { parseTickerList, toSourceSymbol, type Quote, type QuoteResult } from '@/lib/quotes'

type ChartMeta = {
  symbol: string
  currency?: string
  fullExchangeName?: string
  exchangeName?: string
  instrumentType?: string
  regularMarketPrice?: number
  chartPreviousClose?: number
  previousClose?: number
  regularMarketDayHigh?: number
  regularMarketDayLow?: number
  fiftyTwoWeekHigh?: number
  fiftyTwoWeekLow?: number
  regularMarketVolume?: number
  regularMarketTime?: number
  longName?: string
  shortName?: string
}

type ChartResponse = {
  chart?: {
    result?: Array<{
      meta: ChartMeta
      indicators?: { quote?: Array<{ close?: Array<number | null> }> }
    }> | null
    error?: { description?: string } | null
  }
}

async function fetchQuote(ticker: string): Promise<QuoteResult> {
  const sourceSymbol = toSourceSymbol(ticker)
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    sourceSymbol,
  )}?interval=5m&range=1d`

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TickerHeatmap/1.0)' },
      next: { revalidate: 15 },
    })
    const data = (await res.json()) as ChartResponse
    const result = data.chart?.result?.[0]

    if (!res.ok || !result || typeof result.meta.regularMarketPrice !== 'number') {
      return { symbol: ticker, quote: null, error: data.chart?.error?.description ?? 'Ticker not found' }
    }

    const meta = result.meta
    const price = meta.regularMarketPrice as number
    const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? price
    const change = price - previousClose
    const intraday = (result.indicators?.quote?.[0]?.close ?? []).filter(
      (v): v is number => typeof v === 'number',
    )

    const quote: Quote = {
      symbol: ticker,
      sourceSymbol,
      name: meta.longName ?? meta.shortName ?? ticker,
      currency: meta.currency ?? 'USD',
      exchange: meta.fullExchangeName ?? meta.exchangeName ?? '',
      instrumentType: meta.instrumentType ?? '',
      price,
      previousClose,
      change,
      changePercent: previousClose ? (change / previousClose) * 100 : 0,
      dayHigh: meta.regularMarketDayHigh ?? null,
      dayLow: meta.regularMarketDayLow ?? null,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow ?? null,
      volume: meta.regularMarketVolume ?? null,
      marketTime: (meta.regularMarketTime ?? 0) * 1000,
      intraday,
    }
    return { symbol: ticker, quote, error: null }
  } catch {
    return { symbol: ticker, quote: null, error: 'Unable to load quote' }
  }
}

export async function GET(request: NextRequest) {
  const tickers = parseTickerList(request.nextUrl.searchParams.get('symbols'))
  if (tickers.length === 0) {
    return NextResponse.json({ results: [] satisfies QuoteResult[] })
  }
  const results = await Promise.all(tickers.map(fetchQuote))
  return NextResponse.json({ results })
}
