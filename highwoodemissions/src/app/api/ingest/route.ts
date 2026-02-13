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

export async function POST(request: NextRequest) {
  try {
    const idempotencyKey = request.headers.get('X-Idempotency-Key')

    if (!idempotencyKey) {
      return errorResponse('MISSING_IDEMPOTENCY_KEY', 'X-Idempotency-Key header is required')
    }

    const body = await request.json()
    const { site_id, readings } = body

    if (!site_id || typeof site_id !== 'number') {
      return errorResponse('VALIDATION_ERROR', 'site_id is required and must be a number', { site_id })
    }

    if (!Array.isArray(readings) || readings.length === 0) {
      return errorResponse('VALIDATION_ERROR', 'readings must be a non-empty array')
    }

    if (readings.length > 10000) {
      return errorResponse('VALIDATION_ERROR', 'Maximum 10000 readings allowed', { count: readings.length })
    }

    const validatedReadings = readings.map((r, index) => {
      const value = typeof r === 'object' ? r.value : r
      const reading_date = typeof r === 'object' && r.reading_date ? new Date(r.reading_date) : new Date()
      
      if (typeof value !== 'number' || isNaN(value)) {
        throw new Error(`Invalid reading at index ${index}: must be a number`)
      }
      
      return {
        value,
        reading_date: isNaN(reading_date.getTime()) ? new Date() : reading_date
      }
    })

    const existingRecord = await prisma.emissionsData.findFirst({
      where: { idempotencyKey }
    })

    if (existingRecord) {
      const allEmissions = await prisma.emissionsData.findMany({
        where: { idempotencyKey },
        orderBy: { reading_date: 'desc' }
      })
      return successResponse({
        idempotency_key: idempotencyKey,
        message: 'Duplicate request - already processed',
        original_response: {
          emissions_created: allEmissions.map(e => ({
            id: e.id,
            emissionsdata: e.emissionsdata
          })),
          count: allEmissions.length
        }
      }, 200)
    }

    const site = await prisma.site.findUnique({
      where: { id: site_id }
    })

    if (!site) {
      return errorResponse('NOT_FOUND', 'Site not found', { site_id }, 404)
    }

    const result = await prisma.$transaction(async (tx) => {
      const createdEmissions = await Promise.all(
        validatedReadings.map((reading) =>
          tx.emissionsData.create({
            data: {
              siteId: site_id,
              emissionsdata: reading.value,
              reading_date: reading.reading_date,
              idempotencyKey
            }
          })
        )
      )

      const allSiteEmissions = await tx.emissionsData.findMany({
        where: { siteId: site_id }
      })

      const calculatedTotal = allSiteEmissions.reduce((sum, e) => sum + e.emissionsdata, 0)

      const updatedSite = await tx.site.update({
        where: { id: site_id },
        data: {
          total_emissions_to_date: calculatedTotal
        }
      })

      return {
        emissions: createdEmissions,
        site: updatedSite
      }
    })

    return successResponse({
      idempotency_key: idempotencyKey,
      message: 'Batch ingested successfully',
      emissions_created: result.emissions.map(e => ({
        id: e.id,
        emissionsdata: e.emissionsdata
      })),
      site_updated: {
        id: result.site.id,
        total_emissions_to_date: result.site.total_emissions_to_date
      }
    }, 201)

  } catch (error) {
    console.error('Error ingesting batch:', error)
    if (error instanceof SyntaxError) {
      return errorResponse('INVALID_JSON', 'Request body must be valid JSON', undefined, 400)
    }
    return errorResponse('INTERNAL_ERROR', 'Failed to ingest batch', error, 500)
  }
}

export async function GET() {
  try {
    const sites = await prisma.site.findMany({
      select: {
        id: true,
        name: true,
        total_emissions_to_date: true,
        emission_limit: true,
        metadata: true,
        createdAt: true,
        _count: {
          select: { emissions: true }
        }
      },
      orderBy: { name: 'asc' }
    })
    return successResponse(sites)
  } catch (error) {
    console.error('Error fetching sites:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch sites', error, 500)
  }
}
