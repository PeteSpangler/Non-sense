"use client";

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { SiteSelect, Metrics, SiteFormData } from '@/lib/types'
import { fetchSites, fetchSiteMetrics, createSite } from '@/lib/api'

export default function Sites() {
  const [sites, setSites] = useState<SiteSelect[]>([])
  const [selectedSite, setSelectedSite] = useState<string>('')
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<SiteFormData>({
    name: '',
    emission_limit: 0.25
  })
  const [formSubmitting, setFormSubmitting] = useState(false)

  const fetchSitesData = () => {
    fetchSites()
      .then(data => {
        setSites(data)
      })
      .catch(err => console.error('Error fetching sites:', err))
  }

  useEffect(() => {
    fetchSitesData()
  }, [])

  const handleSiteChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const siteId = e.target.value
    setSelectedSite(siteId)
    setMetrics(null)
    setError(null)

    if (siteId) {
      setLoading(true)
      try {
        const data = await fetchSiteMetrics(parseInt(siteId))
        setMetrics(data)
      } catch {
        setError('Failed to fetch metrics')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitting(true)

    try {
      await createSite(formData.name, formData.emission_limit)
      setFormData({ name: '', emission_limit: 0.25 })
      setShowForm(false)
      fetchSitesData()
    } finally {
      setFormSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black">
        <header className="w-full flex gap-6 mb-8">
          <Link href="/" className="text-blue-600 hover:underline">Home</Link>
          <Link href="/sites" className="font-bold">Sites</Link>
          <Link href="/ingest" className="text-blue-600 hover:underline">Ingest</Link>
        </header>
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50 mb-8">
          Site Metrics
        </h1>

        <div className="w-full max-w-md mb-8">
          <button
            onClick={() => setShowForm(true)}
            className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            + Add New Site
          </button>

          {showForm && (
            <form className="flex flex-col gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 mb-6" onSubmit={handleFormSubmit}>
              <input
                type="text"
                placeholder="Site Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="p-3 border border-gray-300 rounded dark:bg-gray-800 dark:border-gray-700"
                required
              />
              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-600 dark:text-zinc-400">
                  Emission Limit
                </label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="Emission Limit"
                  value={formData.emission_limit}
                  onChange={(e) => setFormData({ ...formData, emission_limit: parseFloat(e.target.value) })}
                  className="w-full p-3 border border-gray-300 rounded dark:bg-gray-800 dark:border-gray-700"
                  required
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 flex h-12 items-center justify-center rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] disabled:opacity-50"
                >
                  {formSubmitting ? 'Creating...' : 'Create Site'}
                </button>
              </div>
            </form>
          )}

          <label className="block text-sm font-medium mb-2 text-zinc-600 dark:text-zinc-400">
            Select a Site
          </label>
          <select
            id="site-select"
            value={selectedSite}
            onChange={handleSiteChange}
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

        {loading && <p className="text-zinc-500">Loading metrics...</p>}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {metrics && (
          <div className="w-full">
            <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4">{metrics.site.name}</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-zinc-500">Emission Limit</p>
                  <p className="font-medium">{metrics.site.emission_limit}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Status</p>
                  <p className={`font-medium ${metrics.compliance.status === 'Within Limit' ? 'text-green-600' : 'text-red-600'}`}>
                    {metrics.compliance.status}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500">Total Emissions</p>
                  <p className="font-medium">{metrics.summary.total_emissions.toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Average Emissions</p>
                  <p className="font-medium">{metrics.summary.average_emissions.toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Readings</p>
                  <p className="font-medium">{metrics.summary.reading_count}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Threshold</p>
                  <p className="font-medium">&gt; {metrics.compliance.threshold} per reading</p>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-4">Emissions History</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                  <th className="p-3 text-left">ID</th>
                  <th className="p-3 text-left">Emissions</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Compliance</th>
                </tr>
              </thead>
              <tbody>
                {metrics.emissions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-3 text-center text-zinc-500">
                      No emissions data
                    </td>
                  </tr>
                ) : (
                  metrics.emissions.map((item) => (
                    <tr
                      key={item.id}
                      className={`border-b dark:border-gray-700 ${
                        item.compliance === 'Within Limit'
                          ? 'bg-green-50 dark:bg-green-900/20'
                          : 'bg-red-50 dark:bg-red-900/20'
                      }`}
                    >
                      <td className="p-3">{item.id}</td>
                      <td className="p-3">{item.emissionsdata}</td>
                      <td className="p-3">{new Date(item.reading_date).toLocaleDateString()}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded text-sm font-medium ${
                            item.compliance === 'Within Limit'
                              ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                              : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                          }`}
                        >
                          {item.compliance}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
