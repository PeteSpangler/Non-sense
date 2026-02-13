"use client";

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { SiteSelect } from '@/lib/types'
import { fetchSitesForIngest } from '@/lib/api'
import { parseCSV, validateReadingsLimit } from '@/lib/utils'

export default function Ingest() {
  const [sites, setSites] = useState<SiteSelect[]>([])
  const [selectedSite, setSelectedSite] = useState<string>('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<{
    success: boolean
    data?: {
      idempotency_key: string
      message: string
      emissions_created: { id: number; emissionsdata: number }[]
      site_updated: { id: number; total_emissions_to_date: number }
    }
    error?: {
      code: string
      message: string
    }
    timestamp: string
  } | null>(null)
  const [idempotencyKey, setIdempotencyKey] = useState(() => {
    return `ingest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchSitesForIngest()
      .then(data => setSites(data))
      .catch(err => console.error('Error fetching sites:', err))
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setResponse({
          success: false,
          error: { code: 'INVALID_FILE', message: 'Only CSV files are allowed' },
          timestamp: new Date().toISOString()
        })
        return
      }
      setFile(selectedFile)
      setResponse(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResponse(null)

    if (!file || !selectedSite) {
      setResponse({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Please select a site and upload a CSV file' },
        timestamp: new Date().toISOString()
      })
      setLoading(false)
      return
    }

    try {
      const text = await file.text()
      const readings = parseCSV(text)

      if (readings.length === 0) {
        setResponse({
          success: false,
          error: { code: 'EMPTY_FILE', message: 'CSV file contains no valid readings' },
          timestamp: new Date().toISOString()
        })
        setLoading(false)
        return
      }

      if (!validateReadingsLimit(readings)) {
        setResponse({
          success: false,
          error: { code: 'TOO_MANY_READINGS', message: `Maximum 10000 readings allowed, got ${readings.length}` },
          timestamp: new Date().toISOString()
        })
        setLoading(false)
        return
      }

      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({
          site_id: parseInt(selectedSite),
          readings
        })
      })

      const data = await res.json()
      setResponse(data)

      if (data.success) {
        setFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        setIdempotencyKey(`ingest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)

        fetchSitesForIngest()
          .then(data => {
            setSites(data)
          })
      }
    } catch {
      setResponse({
        success: false,
        error: { code: 'NETWORK_ERROR', message: 'Failed to upload readings' },
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black">
        <header className="w-full flex gap-6 mb-8">
          <Link href="/" className="text-blue-600 hover:underline">Home</Link>
          <Link href="/sites" className="text-blue-600 hover:underline">Sites</Link>
          <Link href="/ingest" className="font-bold">Ingest</Link>
        </header>
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50 mb-8">
          Upload Methane Readings
        </h1>

        <div className="w-full max-w-md mb-6">
          <label className="block text-sm font-medium mb-2 text-zinc-600 dark:text-zinc-400">
            Select a Site
          </label>
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
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

        <form className="flex flex-col gap-4 w-full max-w-md" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400">
              CSV File (max 10000 readings)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="p-3 border border-gray-300 rounded dark:bg-gray-800 dark:border-gray-700"
            />
            <p className="text-xs text-zinc-500">
              One reading per line: value,date (comma or tab separated)<br />
              0.431533199,2024-01-15<br />
              1.849428,2024-01-16
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Idempotency Key
            </label>
            <input
              type="text"
              value={idempotencyKey}
              onChange={(e) => setIdempotencyKey(e.target.value)}
              className="p-3 border border-gray-300 rounded dark:bg-gray-800 dark:border-gray-700 font-mono text-sm"
              readOnly
            />
            <p className="text-xs text-zinc-500">
              Used to prevent duplicate uploads on retry
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !file || !selectedSite}
            className="flex h-12 items-center justify-center rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Upload Readings'}
          </button>
        </form>

        {response && (
          <div className={`mt-6 p-4 rounded ${response.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'} w-full max-w-md`}>
            <p className={`text-sm font-medium ${response.success ? 'text-green-800' : 'text-red-800'}`}>
              {response.success ? 'Success:' : `Error (${response.error?.code}):`}
            </p>
            <pre className="mt-2 text-xs overflow-auto max-h-40">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}
