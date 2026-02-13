import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  fetchSites,
  createSite,
  fetchSiteMetrics,
  fetchSitesForIngest,
  ingestReadings
} from '../src/lib/api'

const API_BASE = '/api'

describe('API Functions', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('fetchSites', () => {
    it('fetches sites successfully', async () => {
      const mockSites = [
        { id: 1, name: 'Site 1', emission_limit: 0.25 }
      ]
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockSites })
      } as Response)

      const result = await fetchSites()
      expect(result).toEqual(mockSites)
      expect(fetch).toHaveBeenCalledWith(`${API_BASE}/sites`)
    })

    it('throws error when response is not successful', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, error: { message: 'Failed' } })
      } as Response)

      await expect(fetchSites()).rejects.toThrow('Failed')
    })
  })

  describe('createSite', () => {
    it('creates site successfully', async () => {
      const mockSite = { id: 1, name: 'New Site', emission_limit: 0.25 }
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockSite })
      } as Response)

      const result = await createSite('New Site', 0.25)
      expect(result).toEqual(mockSite)
      expect(fetch).toHaveBeenCalledWith(`${API_BASE}/sites`, expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Site', emission_limit: 0.25, metadata: {} })
      }))
    })

    it('throws error when creation fails', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, error: { message: 'Name required' } })
      } as Response)

      await expect(createSite('', 0.25)).rejects.toThrow('Name required')
    })
  })

  describe('fetchSiteMetrics', () => {
    it('fetches metrics successfully', async () => {
      const mockMetrics = {
        site: { id: 1, name: 'Site 1', emission_limit: 0.25, metadata: {} },
        summary: { total_emissions: 1.5, average_emissions: 0.3, max_emission: 0.5, reading_count: 5 },
        compliance: { status: 'Within Limit' as const, threshold: 0.25 },
        emissions: []
      }
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockMetrics })
      } as Response)

      const result = await fetchSiteMetrics(1)
      expect(result).toEqual(mockMetrics)
      expect(fetch).toHaveBeenCalledWith(`${API_BASE}/sites/1/metrics`)
    })

    it('throws error when fetch fails', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, error: { message: 'Not found' } })
      } as Response)

      await expect(fetchSiteMetrics(999)).rejects.toThrow('Not found')
    })
  })

  describe('fetchSitesForIngest', () => {
    it('fetches sites for ingest successfully', async () => {
      const mockSites = [
        { id: 1, name: 'Site 1', total_emissions_to_date: 1.5, emission_limit: 0.25 }
      ]
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockSites })
      } as Response)

      const result = await fetchSitesForIngest()
      expect(result).toEqual(mockSites)
      expect(fetch).toHaveBeenCalledWith(`${API_BASE}/ingest`)
    })
  })

  describe('ingestReadings', () => {
    it('ingests readings successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          emissions_created: [{ id: 1, emissionsdata: 0.5 }],
          site_updated: { id: 1, total_emissions_to_date: 2.0 }
        }
      }
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const readings = [{ value: 0.5, reading_date: '2025-01-01' }]
      const result = await ingestReadings(1, readings, 'test-key')

      expect(result.success).toBe(true)
      expect(result.message).toBe('Data ingested successfully!')
      expect(result.data?.emissions_created).toBe(1)
      expect(result.data?.site_updated.total_emissions_to_date).toBe(2.0)
      
      expect(fetch).toHaveBeenCalledWith(`${API_BASE}/ingest`, expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': 'test-key'
        },
        body: JSON.stringify({ site_id: 1, readings })
      }))
    })

    it('returns error when ingestion fails', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, error: { message: 'Invalid readings' } })
      } as Response)

      const readings = [{ value: 0.5, reading_date: '2025-01-01' }]
      const result = await ingestReadings(1, readings, 'test-key')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid readings')
    })

    it('includes idempotency key in request', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { emissions_created: [], site_updated: { id: 1, total_emissions_to_date: 0 } } })
      } as Response)

      const readings = [{ value: 0.5, reading_date: '2025-01-01' }]
      await ingestReadings(1, readings, 'unique-key-12345')

      expect(fetch).toHaveBeenCalledWith(`${API_BASE}/ingest`, expect.objectContaining({
        headers: expect.objectContaining({
          'X-Idempotency-Key': 'unique-key-12345'
        })
      }))
    })
  })
})
