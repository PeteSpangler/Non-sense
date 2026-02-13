import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'

const mockFetch = vi.fn()
const mockRouter = { push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}))

vi.stubGlobal('fetch', mockFetch)

afterEach(() => {
  vi.clearAllMocks()
  cleanup()
})

describe('Home Page', () => {
  const mockSites = [
    {
      id: 1,
      name: 'Test Site',
      emission_limit: 0.25,
      total_emissions_to_date: 1.5,
      metadata: {},
      createdAt: '2025-01-01',
      latest_emission: {
        id: 1,
        emissionsdata: 0.2,
        reading_date: '2025-01-15',
      },
    },
  ]

  beforeEach(() => {
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/sites') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: mockSites }),
        } as Response)
      }
      return Promise.reject(new Error('Not found'))
    })
  })

  it('renders page title', async () => {
    const Home = (await import('../src/app/page')).default
    render(<Home />)
    
    await waitFor(() => {
      expect(screen.getByText('Monitoring Dashboard')).toBeInTheDocument()
    })
  })

  it('renders Sites Overview section', async () => {
    const Home = (await import('../src/app/page')).default
    render(<Home />)
    
    await waitFor(() => {
      expect(screen.getByText('Sites Overview')).toBeInTheDocument()
    })
  })

  it('renders Manual Ingestion section', async () => {
    const Home = (await import('../src/app/page')).default
    render(<Home />)
    
    await waitFor(() => {
      expect(screen.getByText('Manual Ingestion')).toBeInTheDocument()
    })
  })

  it('renders navigation links', async () => {
    const Home = (await import('../src/app/page')).default
    render(<Home />)
    
    await waitFor(() => {
      const links = screen.getAllByRole('link')
      expect(links.length).toBeGreaterThanOrEqual(3)
    })
  })

  it('renders Submit Readings button', async () => {
    const Home = (await import('../src/app/page')).default
    render(<Home />)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /submit readings/i })).toBeInTheDocument()
    })
  })
})

describe('Sites Page', () => {
  beforeEach(() => {
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/sites') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        } as Response)
      }
      return Promise.reject(new Error('Not found'))
    })
  })

  it('renders page title', async () => {
    const Sites = (await import('../src/app/sites/page')).default
    render(<Sites />)
    
    await waitFor(() => {
      expect(screen.getByText('Site Metrics')).toBeInTheDocument()
    })
  })

  it('renders Add New Site button', async () => {
    const Sites = (await import('../src/app/sites/page')).default
    render(<Sites />)
    
    await waitFor(() => {
      expect(screen.getByText('+ Add New Site')).toBeInTheDocument()
    })
  })

  it('renders site select dropdown', async () => {
    const Sites = (await import('../src/app/sites/page')).default
    render(<Sites />)
    
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
  })

  it('renders navigation links', async () => {
    const Sites = (await import('../src/app/sites/page')).default
    render(<Sites />)
    
    await waitFor(() => {
      const links = screen.getAllByRole('link')
      expect(links.length).toBeGreaterThanOrEqual(3)
    })
  })
})

describe('Ingest Page', () => {
  beforeEach(() => {
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/ingest') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: [] }),
        } as Response)
      }
      return Promise.reject(new Error('Not found'))
    })
  })

  it('renders page title', async () => {
    const Ingest = (await import('../src/app/ingest/page')).default
    render(<Ingest />)
    
    await waitFor(() => {
      expect(screen.getByText('Upload Methane Readings')).toBeInTheDocument()
    })
  })

  it('renders site select dropdown', async () => {
    const Ingest = (await import('../src/app/ingest/page')).default
    render(<Ingest />)
    
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
  })

  it('renders Upload Readings button', async () => {
    const Ingest = (await import('../src/app/ingest/page')).default
    render(<Ingest />)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upload readings/i })).toBeInTheDocument()
    })
  })

  it('renders navigation links', async () => {
    const Ingest = (await import('../src/app/ingest/page')).default
    render(<Ingest />)
    
    await waitFor(() => {
      const links = screen.getAllByRole('link')
      expect(links.length).toBeGreaterThanOrEqual(3)
    })
  })
})
