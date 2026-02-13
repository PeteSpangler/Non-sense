import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
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

describe('parseCSV - with test file', () => {
  it('parses test_emissions.csv correctly', () => {
    const csvPath = path.join(__dirname, 'test_emissions.csv')
    const csv = fs.readFileSync(csvPath, 'utf-8')
    
    const result = parseCSV(csv)
    
    expect(result).toHaveLength(9)
    expect(result[0]).toEqual({ value: 0.078362, reading_date: '2026-01-25' })
    expect(result[8]).toEqual({ value: 0.151130, reading_date: '2026-02-02' })
  })

  it('correctly parses dates from test file', () => {
    const csvPath = path.join(__dirname, 'test_emissions.csv')
    const csv = fs.readFileSync(csvPath, 'utf-8')
    
    const result = parseCSV(csv)
    
    const dates = result.map(r => r.reading_date)
    expect(dates).toContain('2026-01-25')
    expect(dates).toContain('2025-11-30')
  })

  it('calculates correct values from test file', () => {
    const csvPath = path.join(__dirname, 'test_emissions.csv')
    const csv = fs.readFileSync(csvPath, 'utf-8')
    
    const result = parseCSV(csv)
    const emissions = result.map(r => ({ emissionsdata: r.value }))
    
    const total = calculateTotalEmissions(emissions)
    expect(total).toBeCloseTo(2.193197, 5)
    
    const avg = calculateAverageEmissions(emissions)
    expect(avg).toBeCloseTo(0.24368856, 5)
    
    const max = findMaxEmission(emissions)
    expect(max).toBeCloseTo(0.444811, 5)
  })

  it('determines compliance from test file correctly', () => {
    const csvPath = path.join(__dirname, 'test_emissions.csv')
    const csv = fs.readFileSync(csvPath, 'utf-8')
    
    const result = parseCSV(csv)
    const emissions = result.map(r => ({ emissionsdata: r.value }))
    
    const compliance = determineCompliance(emissions, 0.25)
    expect(compliance).toBe('Limit Exceeded')
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
