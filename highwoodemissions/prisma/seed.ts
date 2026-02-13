import 'dotenv/config'
import { PrismaClient } from '../src/generated/client'

const prisma = new PrismaClient()

const birdNames = ['Sparrow', 'Eagle', 'Hawk', 'Owl', 'Finch']

const emissionValues = [
  0.431533199,
  1.849428,
  0.063580799,
  0.0670176,
  0.1308848,
  0.022339199,
  0.223320398,
  0.1237964,
  0.145920802,
  0.0973044,
  0.172412798,
  0.046253599,
  0.154154801,
  0.276948799,
  0.0348692,
  0.18616,
  0.401103202,
  0.024845198,
  0.0850608,
  0.0972328
]

function getRandomDateInPast90Days(): Date {
  const now = new Date()
  const daysAgo = Math.floor(Math.random() * 90)
  const hoursAgo = Math.floor(Math.random() * 24)
  const minutesAgo = Math.floor(Math.random() * 60)
  const date = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000) - (minutesAgo * 60 * 1000))
  return date
}

async function main() {
  console.log('Seeding database...')

  for (const birdName of birdNames) {
    const site = await prisma.site.create({
      data: {
        name: birdName,
        emission_limit: 0.25,
        metadata: {}
      }
    })

    const siteEmissions = emissionValues.splice(0, 4)

    for (const value of siteEmissions) {
      await prisma.emissionsData.create({
        data: {
          siteId: site.id,
          emissionsdata: value,
          reading_date: getRandomDateInPast90Days()
        }
      })
    }
  }

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
