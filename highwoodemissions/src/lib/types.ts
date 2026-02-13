export interface Site {
  id: number
  name: string
  emission_limit: number
  total_emissions_to_date: number
  metadata: Record<string, unknown>
  createdAt: string
  latest_emission?: {
    id: number
    emissionsdata: number
    reading_date: string
  } | null
}

export interface Emission {
  id: number
  emissionsdata: number
  reading_date: string
  compliance: 'Within Limit' | 'Limit Exceeded'
}

export interface RetryState {
  isRetrying: boolean
  retryCount: number
  lastError: string | null
}

export interface IngestionForm {
  site_id: string
  readings: string
}

export interface IngestionResult {
  success: boolean
  message: string
  data?: {
    emissions_created: number
    site_updated: {
      id: number
      total_emissions_to_date: number
    }
  }
  error?: string
  isRetry?: boolean
}

export interface SiteFormData {
  name: string
  emission_limit: number
}

export interface FormResponse {
  success: boolean
  error?: { code: string; message: string }
  timestamp: string
}

export interface Metrics {
  site: {
    id: number
    name: string
    emission_limit: number
    metadata: Record<string, unknown>
  }
  summary: {
    total_emissions: number
    average_emissions: number
    max_emission: number
    reading_count: number
  }
  compliance: {
    status: 'Within Limit' | 'Limit Exceeded'
    threshold: number
  }
  emissions: Emission[]
}

export interface SiteSelect {
  id: number
  name: string
  total_emissions_to_date: number
  emission_limit: number
}

export interface ReadingInput {
  value: number
  reading_date: string
}
