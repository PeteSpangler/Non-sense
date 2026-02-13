import { Site, SiteSelect, Metrics, ReadingInput, IngestionResult } from './types'

const API_BASE = '/api'

export async function fetchSites(): Promise<Site[]> {
  const res = await fetch(`${API_BASE}/sites`)
  const data = await res.json()
  if (data.success) {
    return data.data
  }
  throw new Error(data.error?.message || 'Failed to fetch sites')
}

export async function createSite(name: string, emission_limit: number): Promise<Site> {
  const res = await fetch(`${API_BASE}/sites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, emission_limit, metadata: {} }),
  })
  const data = await res.json()
  if (data.success) {
    return data.data
  }
  throw new Error(data.error?.message || 'Failed to create site')
}

export async function fetchSiteMetrics(siteId: number): Promise<Metrics> {
  const res = await fetch(`${API_BASE}/sites/${siteId}/metrics`)
  const data = await res.json()
  if (data.success) {
    return data.data
  }
  throw new Error(data.error?.message || 'Failed to fetch metrics')
}

export async function fetchSitesForIngest(): Promise<SiteSelect[]> {
  const res = await fetch(`${API_BASE}/ingest`)
  const data = await res.json()
  if (data.success) {
    return data.data
  }
  throw new Error(data.error?.message || 'Failed to fetch sites')
}

export async function ingestReadings(
  siteId: number,
  readings: ReadingInput[],
  idempotencyKey: string
): Promise<IngestionResult> {
  const res = await fetch(`${API_BASE}/ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({ site_id: siteId, readings }),
  })
  const data = await res.json()
  if (data.success) {
    return {
      success: true,
      message: 'Data ingested successfully!',
      data: {
        emissions_created: data.data.emissions_created.length,
        site_updated: data.data.site_updated,
      },
    }
  }
  return {
    success: false,
    message: 'Error',
    error: data.error?.message || 'Ingestion failed',
  }
}
