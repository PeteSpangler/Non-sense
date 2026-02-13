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

export async function GET() {
  try {
    const sites = await prisma.site.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        emissions: {
          orderBy: { reading_date: 'desc' },
          take: 1
        }
      }
    })

    const sitesWithLatest = sites.map(site => ({
      ...site,
      latest_emission: site.emissions[0] || null
    }))

    return successResponse(sitesWithLatest)
  } catch (error) {
    console.error('Error fetching sites:', error)
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch sites', error, 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { name, emission_limit, metadata } = body

    if (!name || typeof name !== 'string') {
      return errorResponse('VALIDATION_ERROR', 'Name is required and must be a string', { name })
    }

    if (emission_limit === undefined || typeof emission_limit !== 'number') {
      return errorResponse('VALIDATION_ERROR', 'Emission limit is required and must be a number', { emission_limit })
    }

    if (metadata === undefined || typeof metadata !== 'object') {
      return errorResponse('VALIDATION_ERROR', 'Metadata is required and must be an object', { metadata })
    }

    const site = await prisma.site.create({
      data: {
        name,
        emission_limit,
        metadata
      }
    })

    return successResponse(site, 201)
  } catch (error) {
    console.error('Error creating site:', error)
    if (error instanceof SyntaxError) {
      return errorResponse('INVALID_JSON', 'Request body must be valid JSON', undefined, 400)
    }
    return errorResponse('INTERNAL_ERROR', 'Failed to create site', error, 500)
  }
}
