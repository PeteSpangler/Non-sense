"use client";

import { useState } from 'react'

interface Site {
  id: number
  name: string
}

interface Emission {
  id: number
  emissionsdata: number
  createdAt: string
}

export default function SiteSelector({ initialSites }: { initialSites: Site[] }) {
  const [sites] = useState<Site[]>(initialSites)
  const [emissions, setEmissions] = useState<Emission[]>([])
  const [selectedSite, setSelectedSite] = useState<string>('')

  const handleSiteChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const siteId = e.target.value
    setSelectedSite(siteId)
    if (siteId) {
      const response = await fetch(`/api/emissions?siteId=${siteId}`)
      const data = await response.json()
      setEmissions(data)
    } else {
      setEmissions([])
    }
  }

  return (
    <>
      <div className="w-full max-w-md">
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
      <div className="w-full max-w-md mt-8">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-300 dark:border-gray-600">
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Emissions</th>
              <th className="p-3 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {emissions.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-3 text-center text-zinc-500">
                  {selectedSite ? 'No emissions data' : 'Select a site to view emissions'}
                </td>
              </tr>
            ) : (
              emissions.map((item) => (
                <tr key={item.id} className="border-b dark:border-gray-700">
                  <td className="p-3">{item.id}</td>
                  <td className="p-3">{item.emissionsdata}</td>
                  <td className="p-3">{new Date(item.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
