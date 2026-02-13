import { describe, it, expect } from 'vitest'
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

  it('returns error for whitespace-only name', () => {
    const result = validateSiteForm({ name: '   ', emission_limit: 0.25 })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Site name is required')
  })

  it('returns error for missing emission_limit', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = validateSiteForm({ name: 'Test Site', emission_limit: undefined as any })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Emission limit is required and must be a number')
  })

  it('returns error for NaN emission_limit', () => {
    const result = validateSiteForm({ name: 'Test Site', emission_limit: NaN })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Emission limit is required and must be a number')
  })

  it('returns multiple errors when both fields invalid', () => {
    const result = validateSiteForm({ name: '', emission_limit: NaN })
    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(2)
  })

  it('accepts zero as valid emission_limit', () => {
    const result = validateSiteForm({ name: 'Test Site', emission_limit: 0 })
    expect(result.valid).toBe(true)
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

  it('returns error for whitespace-only site_id', () => {
    const result = validateIngestionForm({ site_id: '   ', readings: '0.5,2025-01-01' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Please select a site')
  })

  it('returns error for empty readings', () => {
    const result = validateIngestionForm({ site_id: '1', readings: '' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Please enter readings')
  })

  it('returns error for whitespace-only readings', () => {
    const result = validateIngestionForm({ site_id: '1', readings: '   ' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Please enter readings')
  })

  it('returns multiple errors when both fields invalid', () => {
    const result = validateIngestionForm({ site_id: '', readings: '' })
    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(2)
  })
})

describe('validateReading', () => {
  it('returns true for valid reading', () => {
    const reading = { value: 0.5, reading_date: '2025-01-01' }
    expect(validateReading(reading)).toBe(true)
  })

  it('returns true for reading with ISO date', () => {
    const reading = { value: 0.5, reading_date: '2025-01-15T10:30:00Z' }
    expect(validateReading(reading)).toBe(true)
  })

  it('returns false for missing value', () => {
    const reading = { reading_date: '2025-01-01' }
    expect(validateReading(reading)).toBe(false)
  })

  it('returns false for undefined value', () => {
    const reading = { value: undefined, reading_date: '2025-01-01' }
    expect(validateReading(reading)).toBe(false)
  })

  it('returns false for NaN value', () => {
    const reading = { value: NaN, reading_date: '2025-01-01' }
    expect(validateReading(reading)).toBe(false)
  })

  it('returns false for missing reading_date', () => {
    const reading = { value: 0.5 }
    expect(validateReading(reading)).toBe(false)
  })

  it('returns false for empty reading_date', () => {
    const reading = { value: 0.5, reading_date: '' }
    expect(validateReading(reading)).toBe(false)
  })

  it('returns false for whitespace-only reading_date', () => {
    const reading = { value: 0.5, reading_date: '   ' }
    expect(validateReading(reading)).toBe(false)
  })

  it('returns false for invalid date', () => {
    const reading = { value: 0.5, reading_date: 'invalid-date' }
    expect(validateReading(reading)).toBe(false)
  })

  it('returns false for null', () => {
    expect(validateReading(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(validateReading(undefined)).toBe(false)
  })

  it('returns false for non-object', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(validateReading('string' as any)).toBe(false)
  })

  it('returns false for array', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(validateReading([0.5, '2025-01-01'] as any)).toBe(false)
  })

  it('returns false for number', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(validateReading(123 as any)).toBe(false)
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

  it('returns true for single reading', () => {
    const readings = [{ value: 0.5, reading_date: '2025-01-01' }]
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
    expect(validateSiteId(0)).toBe(true)
  })

  it('returns false for NaN', () => {
    expect(validateSiteId(NaN)).toBe(false)
  })

  it('returns false for string', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(validateSiteId('1' as any)).toBe(false)
  })

  it('returns false for null', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(validateSiteId(null as any)).toBe(false)
  })

  it('returns false for undefined', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(validateSiteId(undefined as any)).toBe(false)
  })
})

describe('validateIdempotencyKey', () => {
  it('returns true for non-empty string', () => {
    expect(validateIdempotencyKey('test-key-123')).toBe(true)
  })

  it('returns true for whitespace string', () => {
    expect(validateIdempotencyKey('   ')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(validateIdempotencyKey('')).toBe(false)
  })

  it('returns false for non-string', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(validateIdempotencyKey(123 as any)).toBe(false)
  })

  it('returns false for null', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(validateIdempotencyKey(null as any)).toBe(false)
  })

  it('returns false for undefined', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(validateIdempotencyKey(undefined as any)).toBe(false)
  })

  it('returns false for object', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(validateIdempotencyKey({ key: 'value' } as any)).toBe(false)
  })
})

describe('validateEmissionLimit', () => {
  it('returns true for valid number', () => {
    expect(validateEmissionLimit(0.25)).toBe(true)
    expect(validateEmissionLimit(0)).toBe(true)
    expect(validateEmissionLimit(1)).toBe(true)
  })

  it('returns false for negative number', () => {
    expect(validateEmissionLimit(-1)).toBe(false)
    expect(validateEmissionLimit(-0.01)).toBe(false)
  })

  it('returns false for NaN', () => {
    expect(validateEmissionLimit(NaN)).toBe(false)
  })

  it('returns false for string', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(validateEmissionLimit('0.25' as any)).toBe(false)
  })

  it('returns false for null', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(validateEmissionLimit(null as any)).toBe(false)
  })
})

describe('validateMetadata', () => {
  it('returns true for empty object', () => {
    expect(validateMetadata({})).toBe(true)
  })

  it('returns true for object with properties', () => {
    expect(validateMetadata({ key: 'value' })).toBe(true)
    expect(validateMetadata({ a: 1, b: true, c: null })).toBe(true)
  })

  it('returns true for nested object', () => {
    expect(validateMetadata({ nested: { deep: 'value' } })).toBe(true)
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

  it('returns false for boolean', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(validateMetadata(true as any)).toBe(false)
  })

  it('returns false for undefined', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(validateMetadata(undefined as any)).toBe(false)
  })
})
