import { PrismaClient } from '@/generated/client'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const siteId = searchParams.get('siteId')

  if (!siteId) {
    return NextResponse.json([])
  }

  const emissions = await prisma.emissionsData.findMany({
    where: { siteId: parseInt(siteId) },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(emissions)
}
