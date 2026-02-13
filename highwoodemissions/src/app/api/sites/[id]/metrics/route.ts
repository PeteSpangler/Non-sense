import { PrismaClient } from '@/generated/client'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
  timestamp: string
}

function successResponse<T>(data: T, status: number = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    timestamp: new Date().toISOString()
  }, { status })
}

function errorResponse(code: string, message: string, details?: unknown, status: number = 400): NextResponse<ApiResponse<null>> {
  return NextResponse.json({
    success: false,
    error: {
      code,
      message,
      details
    },
    timestamp: new Date().toISOString()
  }, { status })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const siteId = parseInt(id)

    if (isNaN(siteId)) {
      return errorResponse('VALIDATION_ERROR', 'Invalid site ID', { id })
    }

    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: {
        emissions: {
          orderBy: { reading_date: 'desc' }
        }
      }
    })

    if (!site) {
      return errorResponse('NOT_FOUND', 'Site not found', { siteId }, 404)
    }

    const totalEmissions = site.emissions.reduce((sum, e) => sum + e.emissionsdata, 0)
    const averageEmissions = site.emissions.length > 0 ? totalEmissions / site.emissions.length : 0
    const maxEmission = site.emissions.length > 0 ? Math.max(...site.emissions.map(e => e.emissionsdata)) : 0

    const COMPLIANCE_THRESHOLD = 0.25

    const metrics = {
      site: {
        id: site.id,
        name: site.name,
        emission_limit: site.emission_limit,
        metadata: site.metadata
      },
      summary: {
        total_emissions: totalEmissions,
        average_emissions: averageEmissions,
        max_emission: maxEmission,
        reading_count: site.emissions.length
      },
      compliance: {
        status: site.emissions.some(e => e.emissionsdata > COMPLIANCE_THRESHOLD) ? 'Limit Exceeded' : 'Within Limit',
        threshold: COMPLIANCE_THRESHOLD
      },
      emissions: site.emissions.map(e => ({
        id: e.id,
        emissionsdata: e.emissionsdata,
        reading_date: e.reading_date,
        compliance: e.emissionsdata > COMPLIANCE_THRESHOLD ? 'Limit Exceeded' : 'Within Limit'
      }))
    }

    return successResponse(metrics)
  } catch (error) {
    console.error('Error fetching site metrics:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch site metrics', error, 500)
  }
}
