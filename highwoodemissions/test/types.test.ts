import { describe, it, expect } from 'vitest'
import {
  Site,
  Emission,
  RetryState,
  IngestionForm,
  IngestionResult,
  SiteFormData,
  FormResponse,
  Metrics,
  SiteSelect,
  ReadingInput
} from '../src/lib/types'

describe('Types', () => {
  describe('Site', () => {
    it('has correct structure with latest_emission', () => {
      const site: Site = {
        id: 1,
        name: 'Test Site',
        emission_limit: 0.25,
        total_emissions_to_date: 1.5,
        metadata: {},
        createdAt: '2025-01-01',
        latest_emission: {
          id: 1,
          emissionsdata: 0.3,
          reading_date: '2025-01-15',
        },
      }

      expect(site.id).toBe(1)
      expect(site.name).toBe('Test Site')
      expect(site.emission_limit).toBe(0.25)
      expect(site.total_emissions_to_date).toBe(1.5)
      expect(site.metadata).toEqual({})
      expect(site.createdAt).toBe('2025-01-01')
      expect(site.latest_emission).toBeDefined()
      expect(site.latest_emission?.emissionsdata).toBe(0.3)
    })

    it('allows null latest_emission', () => {
      const site: Site = {
        id: 1,
        name: 'Test Site',
        emission_limit: 0.25,
        total_emissions_to_date: 0,
        metadata: {},
        createdAt: '2025-01-01',
        latest_emission: null,
      }

      expect(site.latest_emission).toBeNull()
    })

    it('allows undefined latest_emission', () => {
      const site: Site = {
        id: 1,
        name: 'Test Site',
        emission_limit: 0.25,
        total_emissions_to_date: 0,
        metadata: {},
        createdAt: '2025-01-01',
      }

      expect(site.latest_emission).toBeUndefined()
    })

    it('supports metadata with various values', () => {
      const site: Site = {
        id: 1,
        name: 'Test Site',
        emission_limit: 0.25,
        total_emissions_to_date: 0,
        metadata: {
          location: 'Building A',
          tags: ['monitoring', 'priority'],
          config: { threshold: 0.3 }
        },
        createdAt: '2025-01-01',
      }

      expect(site.metadata.location).toBe('Building A')
      expect(site.metadata.tags).toEqual(['monitoring', 'priority'])
    })
  })

  describe('Emission', () => {
    it('has correct structure', () => {
      const emission: Emission = {
        id: 1,
        emissionsdata: 0.35,
        reading_date: '2025-01-15',
        compliance: 'Within Limit',
      }

      expect(emission.id).toBe(1)
      expect(emission.emissionsdata).toBe(0.35)
      expect(emission.reading_date).toBe('2025-01-15')
      expect(emission.compliance).toBe('Within Limit')
    })

    it('allows Limit Exceeded status', () => {
      const emission: Emission = {
        id: 1,
        emissionsdata: 0.35,
        reading_date: '2025-01-15',
        compliance: 'Limit Exceeded',
      }

      expect(emission.compliance).toBe('Limit Exceeded')
    })
  })

  describe('RetryState', () => {
    it('has correct structure', () => {
      const state: RetryState = {
        isRetrying: true,
        retryCount: 3,
        lastError: 'Network error',
      }

      expect(state.isRetrying).toBe(true)
      expect(state.retryCount).toBe(3)
      expect(state.lastError).toBe('Network error')
    })

    it('allows null lastError', () => {
      const state: RetryState = {
        isRetrying: false,
        retryCount: 0,
        lastError: null,
      }

      expect(state.lastError).toBeNull()
    })
  })

  describe('IngestionForm', () => {
    it('has correct structure', () => {
      const form: IngestionForm = {
        site_id: '1',
        readings: '0.5,2025-01-01',
      }

      expect(form.site_id).toBe('1')
      expect(form.readings).toBe('0.5,2025-01-01')
    })
  })

  describe('IngestionResult', () => {
    it('has correct success structure', () => {
      const result: IngestionResult = {
        success: true,
        message: 'Data ingested successfully!',
        data: {
          emissions_created: 5,
          site_updated: {
            id: 1,
            total_emissions_to_date: 2.5,
          },
        },
      }

      expect(result.success).toBe(true)
      expect(result.message).toBe('Data ingested successfully!')
      expect(result.data?.emissions_created).toBe(5)
    })

    it('has correct error structure', () => {
      const result: IngestionResult = {
        success: false,
        message: 'Error',
        error: 'Invalid data',
      }

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid data')
    })

    it('supports isRetry flag', () => {
      const result: IngestionResult = {
        success: true,
        message: 'Success',
        isRetry: true,
      }

      expect(result.isRetry).toBe(true)
    })
  })

  describe('SiteFormData', () => {
    it('has correct structure', () => {
      const form: SiteFormData = {
        name: 'New Site',
        emission_limit: 0.25,
      }

      expect(form.name).toBe('New Site')
      expect(form.emission_limit).toBe(0.25)
    })
  })

  describe('FormResponse', () => {
    it('has correct success structure', () => {
      const response: FormResponse = {
        success: true,
        timestamp: '2025-01-15T10:00:00Z',
      }

      expect(response.success).toBe(true)
      expect(response.timestamp).toBe('2025-01-15T10:00:00Z')
    })

    it('has correct error structure', () => {
      const response: FormResponse = {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input' },
        timestamp: '2025-01-15T10:00:00Z',
      }

      expect(response.success).toBe(false)
      expect(response.error?.code).toBe('VALIDATION_ERROR')
      expect(response.error?.message).toBe('Invalid input')
    })
  })

  describe('Metrics', () => {
    it('has correct structure', () => {
      const metrics: Metrics = {
        site: {
          id: 1,
          name: 'Test Site',
          emission_limit: 0.25,
          metadata: {},
        },
        summary: {
          total_emissions: 1.5,
          average_emissions: 0.3,
          max_emission: 0.5,
          reading_count: 5,
        },
        compliance: {
          status: 'Within Limit',
          threshold: 0.25,
        },
        emissions: [],
      }

      expect(metrics.site.id).toBe(1)
      expect(metrics.summary.total_emissions).toBe(1.5)
      expect(metrics.compliance.status).toBe('Within Limit')
      expect(metrics.emissions).toEqual([])
    })

    it('includes emissions list', () => {
      const metrics: Metrics = {
        site: { id: 1, name: 'Test', emission_limit: 0.25, metadata: {} },
        summary: { total_emissions: 1, average_emissions: 0.25, max_emission: 0.5, reading_count: 4 },
        compliance: { status: 'Limit Exceeded', threshold: 0.25 },
        emissions: [
          { id: 1, emissionsdata: 0.3, reading_date: '2025-01-01', compliance: 'Within Limit' },
          { id: 2, emissionsdata: 0.5, reading_date: '2025-01-02', compliance: 'Limit Exceeded' },
        ],
      }

      expect(metrics.emissions).toHaveLength(2)
      expect(metrics.emissions[1].compliance).toBe('Limit Exceeded')
    })
  })

  describe('SiteSelect', () => {
    it('has correct structure', () => {
      const site: SiteSelect = {
        id: 1,
        name: 'Test Site',
        total_emissions_to_date: 1.5,
        emission_limit: 0.25,
      }

      expect(site.id).toBe(1)
      expect(site.name).toBe('Test Site')
      expect(site.total_emissions_to_date).toBe(1.5)
      expect(site.emission_limit).toBe(0.25)
    })
  })

  describe('ReadingInput', () => {
    it('has correct structure', () => {
      const reading: ReadingInput = {
        value: 0.35,
        reading_date: '2025-01-15',
      }

      expect(reading.value).toBe(0.35)
      expect(reading.reading_date).toBe('2025-01-15')
    })

    it('accepts zero value', () => {
      const reading: ReadingInput = {
        value: 0,
        reading_date: '2025-01-15',
      }

      expect(reading.value).toBe(0)
    })

    it('accepts various date formats', () => {
      const reading1: ReadingInput = { value: 0.5, reading_date: '2025-01-15' }
      const reading2: ReadingInput = { value: 0.5, reading_date: '01/15/2025' }
      const reading3: ReadingInput = { value: 0.5, reading_date: '2025-01-15T10:30:00Z' }

      expect(reading1.reading_date).toBeDefined()
      expect(reading2.reading_date).toBeDefined()
      expect(reading3.reading_date).toBeDefined()
    })
  })
})
