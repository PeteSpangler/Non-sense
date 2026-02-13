"use client";

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Site, RetryState, IngestionForm, IngestionResult } from '@/lib/types'
import { fetchSites, ingestReadings } from '@/lib/api'
import { parseManualReadings, generateIdempotencyKey, isOverLimit, formatDate, validateReadingsLimit } from '@/lib/utils'
import { validateIngestionForm } from '@/lib/validators'

export default function Home() {
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [ingestionForm, setIngestionForm] = useState<IngestionForm>({
    site_id: '',
    readings: ''
  })
  const [idempotencyKey, setIdempotencyKey] = useState('')
  const [ingestionResult, setIngestionResult] = useState<IngestionResult | null>(null)
  const [ingestionLoading, setIngestionLoading] = useState(false)
  const [retryState, setRetryState] = useState<RetryState>({
    isRetrying: false,
    retryCount: 0,
    lastError: null
  })

  const fetchSitesData = async () => {
    try {
      const data = await fetchSites()
      setSites(data)
      setError(null)
    } catch {
      setError('Network error while fetching sites')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSitesData()
  }, [])

  useEffect(() => {
    setIdempotencyKey(generateIdempotencyKey())
  }, [])

  const handleIngestion = async (isRetry: boolean = false) => {
    const validation = validateIngestionForm(ingestionForm)
    if (!validation.valid) {
      setIngestionResult({
        success: false,
        message: 'Validation Error',
        error: validation.errors.join(', ')
      })
      return
    }

    const readings = parseManualReadings(ingestionForm.readings)

    if (readings.length === 0) {
      setIngestionResult({
        success: false,
        message: 'Validation Error',
        error: 'No valid readings found. Use format: value,date (e.g., 0.003423,01/12/2025)'
      })
      return
    }

    if (!validateReadingsLimit(readings)) {
      setIngestionResult({
        success: false,
        message: 'Validation Error',
        error: `Maximum 10000 readings allowed, got ${readings.length}`
      })
      return
    }

    const key = idempotencyKey || generateIdempotencyKey()

    setIngestionLoading(true)
    setRetryState(prev => ({
      ...prev,
      isRetrying: isRetry,
      lastError: null
    }))

    try {
      const result = await ingestReadings(
        parseInt(ingestionForm.site_id),
        readings,
        key
      )

      setIngestionResult(result)

      if (result.success) {
        setRetryState({
          isRetrying: false,
          retryCount: 0,
          lastError: null
        })
        setIdempotencyKey(generateIdempotencyKey())
        setIngestionForm({ ...ingestionForm, readings: '' })
        fetchSitesData()
      } else {
        setRetryState(prev => ({
          ...prev,
          lastError: result.error || 'Error',
          isRetrying: false
        }))
      }
    } catch {
      const errorMessage = 'Network error - please retry'
      setIngestionResult({
        success: false,
        message: 'Network Error',
        error: errorMessage
      })
      setRetryState(prev => ({
        ...prev,
        lastError: errorMessage,
        isRetrying: false
      }))
    } finally {
      setIngestionLoading(false)
    }
  }

  const handleRetry = () => {
    setRetryState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1
    }))
    handleIngestion(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black">
        <header className="w-full flex gap-6 mb-8">
          <Link href="/" className="font-bold">Home</Link>
          <Link href="/sites" className="text-blue-600 hover:underline">Sites</Link>
          <Link href="/ingest" className="text-blue-600 hover:underline">Ingest</Link>
        </header>

        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50 mb-8">
          Monitoring Dashboard
        </h1>

        {loading ? (
          <p className="text-zinc-500">Loading sites...</p>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded mb-8">
            <p className="text-red-800">{error}</p>
            <button
              onClick={fetchSitesData}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="w-full mb-12">
              <h2 className="text-xl font-semibold mb-4">Sites Overview</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                      <th className="p-3 text-left">Site</th>
                      <th className="p-3 text-left">Latest Reading</th>
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sites.map((site) => {
                      const exceedsLimit = site.latest_emission && isOverLimit(site.latest_emission.emissionsdata, site.emission_limit)
                      return (
                        <tr
                          key={site.id}
                          className={`border-b dark:border-gray-700 ${
                            exceedsLimit
                              ? 'bg-red-50 dark:bg-red-900/20'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          <td className="p-3 font-medium">{site.name}</td>
                          <td className="p-3">{site.latest_emission?.emissionsdata.toFixed(6) || '-'}</td>
                          <td className="p-3 text-sm text-zinc-500">
                            {site.latest_emission ? formatDate(site.latest_emission.reading_date) : '-'}
                          </td>
                          <td className="p-3">
                            {site.latest_emission ? (
                              <span
                                className={`px-2 py-1 rounded text-sm font-medium ${
                                  exceedsLimit
                                    ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                                    : 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                                }`}
                              >
                                {exceedsLimit ? 'Limit Exceeded' : 'Within Limit'}
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                No Data
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="w-full">
              <h2 className="text-xl font-semibold mb-4">Manual Ingestion</h2>
              <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-600 dark:text-zinc-400">
                      Select Site
                    </label>
                    <select
                      value={ingestionForm.site_id}
                      onChange={(e) => setIngestionForm({ ...ingestionForm, site_id: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded dark:bg-gray-800 dark:border-gray-700"
                    >
                      <option value="">Choose a site...</option>
                      {sites.map((site) => (
                        <option key={site.id} value={site.id}>
                          {site.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-600 dark:text-zinc-400">
                      Readings (one per line: value,date)
                    </label>
                    <textarea
                      value={ingestionForm.readings}
                      onChange={(e) => setIngestionForm({ ...ingestionForm, readings: e.target.value })}
                      placeholder="0.003423,01/12/2025&#10;0.004521,01/13/2025&#10;0.002891,01/14/2025"
                      className="w-full p-3 border border-gray-300 rounded dark:bg-gray-800 dark:border-gray-700 h-32 font-mono text-sm"
                    />
                    <p className="text-xs text-zinc-500 mt-1">
                      Format: value,date (one per line). Max 10000 readings.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-zinc-600 dark:text-zinc-400">
                      Idempotency Key
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={idempotencyKey}
                        onChange={(e) => setIdempotencyKey(e.target.value)}
                        className="flex-1 p-3 border border-gray-300 rounded dark:bg-gray-800 dark:border-gray-700 font-mono text-sm"
                        placeholder="X-Idempotency-Key"
                      />
                      <button
                        type="button"
                        onClick={() => setIdempotencyKey(generateIdempotencyKey())}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                      >
                        Generate New
                      </button>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      Prevents duplicate data on network retry
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => handleIngestion(false)}
                      disabled={ingestionLoading}
                      className="flex-1 flex h-12 items-center justify-center rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] disabled:opacity-50"
                    >
                      {ingestionLoading ? 'Ingesting...' : 'Submit Readings'}
                    </button>

                    {retryState.lastError && !ingestionLoading && (
                      <button
                        onClick={handleRetry}
                        className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-full hover:bg-amber-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Retry ({retryState.retryCount})
                      </button>
                    )}
                  </div>
                </div>

                {ingestionResult && (
                  <div className={`mt-6 p-4 rounded ${
                    ingestionResult.success
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {ingestionResult.success ? (
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <p className={`font-medium ${
                        ingestionResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {ingestionResult.message}
                      </p>
                      {ingestionResult.isRetry && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded">
                          Retry #{retryState.retryCount}
                        </span>
                      )}
                    </div>
                    {ingestionResult.success && ingestionResult.data && (
                      <div className="text-sm text-green-700">
                        <p>Emissions created: {ingestionResult.data.emissions_created}</p>
                        <p>Site total: {ingestionResult.data.site_updated.total_emissions_to_date.toFixed(6)}</p>
                      </div>
                    )}
                    {ingestionResult.error && (
                      <p className="text-sm text-red-700">{ingestionResult.error}</p>
                    )}
                    {ingestionResult.success && retryState.lastError === null && retryState.retryCount > 0 && (
                      <p className="text-sm text-green-600 mt-2">
                        Successfully recovered from network error after {retryState.retryCount} retry(s)
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
