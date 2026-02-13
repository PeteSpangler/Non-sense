-- CreateTable
CREATE TABLE "Site" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "emission_limit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "total_emissions_to_date" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmissionsData" (
    "id" SERIAL NOT NULL,
    "siteId" INTEGER NOT NULL,
    "emissionsdata" DOUBLE PRECISION NOT NULL,
    "reading_date" TIMESTAMP(3) NOT NULL,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmissionsData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmissionsData_reading_date_idx" ON "EmissionsData"("reading_date");

-- CreateIndex
CREATE INDEX "EmissionsData_siteId_idx" ON "EmissionsData"("siteId");

-- CreateIndex
CREATE INDEX "EmissionsData_idempotencyKey_idx" ON "EmissionsData"("idempotencyKey");

-- AddForeignKey
ALTER TABLE "EmissionsData" ADD CONSTRAINT "EmissionsData_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
