import Papa from 'papaparse'
import { ReadingInput } from './types'

export function parseCSV(text: string): ReadingInput[] {
  const readings: ReadingInput[] = []

  Papa.parse(text, {
    skipEmptyLines: true,
    complete: (results) => {
      results.data.forEach((row: unknown, index: number) => {
        const parts = Array.isArray(row) ? row : []
        const value = parseFloat(parts[0])
        const dateStr = parts[1]?.trim()

        if (index === 0 && isNaN(value)) {
          return
        }

        if (!isNaN(value) && dateStr && !isNaN(Date.parse(dateStr))) {
          readings.push({ value, reading_date: dateStr })
        }
      })
    },
  })

  return readings
}

export function parseManualReadings(text: string): ReadingInput[] {
  if (!text.trim()) {
    return []
  }

  return text
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      const parts = line.split(/[,\t]/)
      const value = parseFloat(parts[0]?.trim())
      const dateStr = parts[1]?.trim()
      return { value, reading_date: dateStr || '' }
    })
    .filter(r => !isNaN(r.value) && r.reading_date)
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString()
}

export function calculateTotalEmissions(emissions: { emissionsdata: number }[]): number {
  return emissions.reduce((sum, e) => sum + e.emissionsdata, 0)
}

export function calculateAverageEmissions(emissions: { emissionsdata: number }[]): number {
  if (emissions.length === 0) return 0
  return calculateTotalEmissions(emissions) / emissions.length
}

export function findMaxEmission(emissions: { emissionsdata: number }[]): number {
  if (emissions.length === 0) return 0
  return Math.max(...emissions.map(e => e.emissionsdata))
}

export function determineCompliance(
  emissions: { emissionsdata: number }[],
  threshold: number
): 'Within Limit' | 'Limit Exceeded' {
  return emissions.some(e => e.emissionsdata > threshold) ? 'Limit Exceeded' : 'Within Limit'
}

export function isOverLimit(value: number, limit: number): boolean {
  return value > limit
}

export function generateIdempotencyKey(): string {
  return `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function validateReadingsLimit(readings: ReadingInput[], maxLimit: number = 10000): boolean {
  return readings.length <= maxLimit
}

export function formatEmissionValue(value: number, decimals: number = 6): string {
  return value.toFixed(decimals)
}
