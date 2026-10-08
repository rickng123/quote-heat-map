import { HeatmapApp } from '@/components/heatmap/heatmap-app'
import { DEFAULT_TICKERS, parseTickerList } from '@/lib/quotes'

export default async function Page({ searchParams }: { searchParams: Promise<{ t?: string | string[] }> }) {
  const { t } = await searchParams
  const fromUrl = parseTickerList(Array.isArray(t) ? t.join(',') : t)
  const initialTickers = t === undefined ? DEFAULT_TICKERS : fromUrl

  return <HeatmapApp initialTickers={initialTickers} />
}
