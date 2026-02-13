import { describe, it, expect } from 'vitest'
import {
  parseCSV,
  parseManualReadings,
  formatDate,
  calculateTotalEmissions,
  calculateAverageEmissions,
  findMaxEmission,
  determineCompliance,
  isOverLimit,
  generateIdempotencyKey,
  validateReadingsLimit,
  formatEmissionValue
} from '../src/lib/utils'
import {
  validateSiteForm,
  validateIngestionForm,
  validateReading,
  validateReadingsArray,
  validateSiteId,
  validateIdempotencyKey,
  validateEmissionLimit,
  validateMetadata
} from '../src/lib/validators'
import {
  Site,
} from '../src/lib/types'

describe('Types - Site', () => {
  it('has correct structure', () => {
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
})

describe('parseCSV', () => {
  it('parses valid CSV with header', () => {
    const csv = `emissions,reading_date
0.5,2025-01-01
0.3,2025-01-02`

    const result = parseCSV(csv)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ value: 0.5, reading_date: '2025-01-01' })
    expect(result[1]).toEqual({ value: 0.3, reading_date: '2025-01-02' })
  })

  it('skips header row', () => {
    const csv = `emissions,reading_date
header1,header2
0.5,2025-01-01`

    const result = parseCSV(csv)
    expect(result).toHaveLength(1)
    expect(result[0].value).toBe(0.5)
  })

  it('handles empty CSV', () => {
    const csv = `emissions,reading_date`
    const result = parseCSV(csv)
    expect(result).toHaveLength(0)
  })

  it('handles tab-separated values', () => {
    const csv = `emissions\treading_date
0.5\t2025-01-01`
    const result = parseCSV(csv)
    expect(result).toHaveLength(1)
  })

  it('handles empty lines', () => {
    const csv = `emissions,reading_date
0.5,2025-01-01

0.3,2025-01-02`
    const result = parseCSV(csv)
    expect(result).toHaveLength(2)
  })
})

describe('parseManualReadings', () => {
  it('parses newline-separated readings', () => {
    const text = `0.5,2025-01-01
0.3,2025-01-02
0.7,2025-01-03`

    const result = parseManualReadings(text)
    expect(result).toHaveLength(3)
  })

  it('filters invalid readings', () => {
    const text = `0.5,2025-01-01
invalid,invalid
0.3,2025-01-02`

    const result = parseManualReadings(text)
    expect(result).toHaveLength(2)
  })

  it('handles empty input', () => {
    const result = parseManualReadings('')
    expect(result).toHaveLength(0)
  })

  it('handles tab-separated values', () => {
    const text = `0.5\t2025-01-01
0.3\t2025-01-02`

    const result = parseManualReadings(text)
    expect(result).toHaveLength(2)
  })
})

describe('formatDate', () => {
  it('formats date string correctly', () => {
    const result = formatDate('2025-01-15')
    expect(result.length).toBeGreaterThan(0)
  })

  it('handles ISO date format', () => {
    const date = new Date('2025-01-15')
    expect(date.getFullYear()).toBe(2025)
  })
})

describe('calculateTotalEmissions', () => {
  it('calculates sum correctly', () => {
    const emissions = [
      { emissionsdata: 0.1 },
      { emissionsdata: 0.2 },
      { emissionsdata: 0.3 },
    ]
    expect(calculateTotalEmissions(emissions)).toBeCloseTo(0.6)
  })

  it('handles empty array', () => {
    expect(calculateTotalEmissions([])).toBe(0)
  })

  it('handles single emission', () => {
    expect(calculateTotalEmissions([{ emissionsdata: 0.5 }])).toBe(0.5)
  })
})

describe('calculateAverageEmissions', () => {
  it('calculates average correctly', () => {
    const emissions = [
      { emissionsdata: 0.1 },
      { emissionsdata: 0.3 },
      { emissionsdata: 0.5 },
    ]
    expect(calculateAverageEmissions(emissions)).toBeCloseTo(0.3, 5)
  })

  it('returns 0 for empty array', () => {
    expect(calculateAverageEmissions([])).toBe(0)
  })
})

describe('findMaxEmission', () => {
  it('finds maximum value', () => {
    const emissions = [
      { emissionsdata: 0.1 },
      { emissionsdata: 0.5 },
      { emissionsdata: 0.3 },
    ]
    expect(findMaxEmission(emissions)).toBe(0.5)
  })

  it('returns 0 for empty array', () => {
    expect(findMaxEmission([])).toBe(0)
  })
})

describe('determineCompliance', () => {
  it('returns Limit Exceeded when above threshold', () => {
    const emissions = [
      { emissionsdata: 0.1 },
      { emissionsdata: 0.3 },
    ]
    expect(determineCompliance(emissions, 0.25)).toBe('Limit Exceeded')
  })

  it('returns Within Limit when all below threshold', () => {
    const emissions = [
      { emissionsdata: 0.1 },
      { emissionsdata: 0.2 },
    ]
    expect(determineCompliance(emissions, 0.25)).toBe('Within Limit')
  })

  it('handles empty array', () => {
    expect(determineCompliance([], 0.25)).toBe('Within Limit')
  })
})

describe('isOverLimit', () => {
  it('returns true when over limit', () => {
    expect(isOverLimit(0.3, 0.25)).toBe(true)
  })

  it('returns false when within limit', () => {
    expect(isOverLimit(0.2, 0.25)).toBe(false)
  })

  it('returns false when equal to limit', () => {
    expect(isOverLimit(0.25, 0.25)).toBe(false)
  })
})

describe('generateIdempotencyKey', () => {
  it('generates unique keys', () => {
    const key1 = generateIdempotencyKey()
    const key2 = generateIdempotencyKey()
    expect(key1).not.toBe(key2)
  })

  it('includes timestamp', () => {
    const key = generateIdempotencyKey()
    expect(key.startsWith('manual-')).toBe(true)
  })

  it('includes random suffix', () => {
    const key = generateIdempotencyKey()
    expect(key.split('-').length).toBeGreaterThanOrEqual(3)
  })
})

describe('validateReadingsLimit', () => {
  it('returns true when under limit', () => {
    const readings = Array(100).fill({ value: 0.5, reading_date: '2025-01-01' })
    expect(validateReadingsLimit(readings)).toBe(true)
  })

  it('returns true when at limit', () => {
    const readings = Array(10000).fill({ value: 0.5, reading_date: '2025-01-01' })
    expect(validateReadingsLimit(readings)).toBe(true)
  })

  it('returns false when over limit', () => {
    const readings = Array(10001).fill({ value: 0.5, reading_date: '2025-01-01' })
    expect(validateReadingsLimit(readings)).toBe(false)
  })

  it('uses default limit of 10000', () => {
    const readings = Array(10001).fill({ value: 0.5, reading_date: '2025-01-01' })
    expect(validateReadingsLimit(readings)).toBe(false)
  })
})

describe('formatEmissionValue', () => {
  it('formats with default 6 decimals', () => {
    expect(formatEmissionValue(0.123456789)).toBe('0.123457')
  })

  it('formats with custom decimals', () => {
    expect(formatEmissionValue(0.123, 3)).toBe('0.123')
  })

  it('handles whole numbers', () => {
    expect(formatEmissionValue(5, 2)).toBe('5.00')
  })
})

describe('validateSiteForm', () => {
  it('returns valid for correct input', () => {
    const result = validateSiteForm({ name: 'Test Site', emission_limit: 0.25 })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('returns error for empty name', () => {
    const result = validateSiteForm({ name: '', emission_limit: 0.25 })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Site name is required')
  })

  it('returns error for missing emission_limit', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = validateSiteForm({ name: 'Test Site', emission_limit: undefined as any })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Emission limit is required and must be a number')
  })
})

describe('validateIngestionForm', () => {
  it('returns valid for correct input', () => {
    const result = validateIngestionForm({ site_id: '1', readings: '0.5,2025-01-01' })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('returns error for empty site_id', () => {
    const result = validateIngestionForm({ site_id: '', readings: '0.5,2025-01-01' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Please select a site')
  })

  it('returns error for empty readings', () => {
    const result = validateIngestionForm({ site_id: '1', readings: '' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Please enter readings')
  })
})

describe('validateReading', () => {
  it('returns true for valid reading', () => {
    const reading = { value: 0.5, reading_date: '2025-01-01' }
    expect(validateReading(reading)).toBe(true)
  })

  it('returns false for missing value', () => {
    const reading = { reading_date: '2025-01-01' }
    expect(validateReading(reading)).toBe(false)
  })

  it('returns false for invalid date', () => {
    const reading = { value: 0.5, reading_date: 'invalid-date' }
    expect(validateReading(reading)).toBe(false)
  })

  it('returns false for null', () => {
    expect(validateReading(null)).toBe(false)
  })

  it('returns false for non-object', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(validateReading('string' as any)).toBe(false)
  })
})

describe('validateReadingsArray', () => {
  it('returns true for valid array', () => {
    const readings = [
      { value: 0.5, reading_date: '2025-01-01' },
      { value: 0.3, reading_date: '2025-01-02' },
    ]
    expect(validateReadingsArray(readings)).toBe(true)
  })

  it('returns false if any reading is invalid', () => {
    const readings = [
      { value: 0.5, reading_date: '2025-01-01' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { value: 'invalid' as any, reading_date: '2025-01-02' },
    ]
    expect(validateReadingsArray(readings)).toBe(false)
  })

  it('returns true for empty array', () => {
    expect(validateReadingsArray([])).toBe(true)
  })
})

describe('validateSiteId', () => {
  it('returns true for valid number', () => {
    expect(validateSiteId(1)).toBe(true)
    expect(validateSiteId(999)).toBe(true)
  })

  it('returns false for NaN', () => {
    expect(validateSiteId(NaN)).toBe(false)
  })

  it('returns false for string', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(validateSiteId('1' as any)).toBe(false)
  })
})

describe('validateIdempotencyKey', () => {
  it('returns true for non-empty string', () => {
    expect(validateIdempotencyKey('test-key-123')).toBe(true)
  })

  it('returns false for empty string', () => {
    expect(validateIdempotencyKey('')).toBe(false)
  })

  it('returns false for non-string', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(validateIdempotencyKey(123 as any)).toBe(false)
  })
})

describe('validateEmissionLimit', () => {
  it('returns true for valid number', () => {
    expect(validateEmissionLimit(0.25)).toBe(true)
    expect(validateEmissionLimit(0)).toBe(true)
  })

  it('returns false for negative number', () => {
    expect(validateEmissionLimit(-1)).toBe(false)
  })

  it('returns false for NaN', () => {
    expect(validateEmissionLimit(NaN)).toBe(false)
  })
})

describe('validateMetadata', () => {
  it('returns true for object', () => {
    expect(validateMetadata({})).toBe(true)
    expect(validateMetadata({ key: 'value' })).toBe(true)
  })

  it('returns false for null', () => {
    expect(validateMetadata(null)).toBe(false)
  })

  it('returns false for array', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(validateMetadata([] as any)).toBe(false)
  })

  it('returns false for primitive string', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(validateMetadata('string' as any)).toBe(false)
  })

  it('returns false for number', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(validateMetadata(123 as any)).toBe(false)
  })
})
