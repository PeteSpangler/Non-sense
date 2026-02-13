import { ReadingInput, SiteFormData, IngestionForm } from './types'

export function validateSiteForm(formData: SiteFormData): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!formData.name || typeof formData.name !== 'string' || formData.name.trim().length === 0) {
    errors.push('Site name is required')
  }

  if (formData.emission_limit === undefined || typeof formData.emission_limit !== 'number' || isNaN(formData.emission_limit)) {
    errors.push('Emission limit is required and must be a number')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function validateIngestionForm(formData: IngestionForm): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!formData.site_id || formData.site_id.trim().length === 0) {
    errors.push('Please select a site')
  }

  if (!formData.readings.trim()) {
    errors.push('Please enter readings')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function validateReading(reading: unknown): reading is ReadingInput {
  if (typeof reading !== 'object' || reading === null) {
    return false
  }

  const r = reading as Record<string, unknown>
  const value = r.value
  const reading_date = r.reading_date

  return (
    typeof value === 'number' &&
    !isNaN(value) &&
    typeof reading_date === 'string' &&
    reading_date.trim().length > 0 &&
    !isNaN(Date.parse(reading_date))
  )
}

export function validateReadingsArray(readings: unknown[]): readings is ReadingInput[] {
  return readings.every(reading => validateReading(reading))
}

export function validateSiteId(siteId: unknown): siteId is number {
  return typeof siteId === 'number' && !isNaN(siteId)
}

export function validateIdempotencyKey(key: unknown): key is string {
  return typeof key === 'string' && key.trim().length > 0
}

export function validateEmissionLimit(limit: unknown): limit is number {
  return typeof limit === 'number' && !isNaN(limit) && limit >= 0
}

export function validateMetadata(metadata: unknown): metadata is Record<string, unknown> {
  return typeof metadata === 'object' && metadata !== null && !Array.isArray(metadata)
}
