-- CreateTable
CREATE TABLE IF NOT EXISTS "group_skid_pricing" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "city_id" VARCHAR(50) NOT NULL,
    "zone_id" VARCHAR(50) NOT NULL,
    "group_id" VARCHAR(50) NOT NULL,
    "skid_count" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) DEFAULT 'CAD',
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),

    CONSTRAINT "group_skid_pricing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "group_skid_pricing_city_id_zone_id_group_id_skid_count_key" ON "group_skid_pricing"("city_id", "zone_id", "group_id", "skid_count");

-- CreateIndex
CREATE INDEX "idx_group_skid_pricing_active" ON "group_skid_pricing"("is_active");

-- CreateIndex
CREATE INDEX "idx_group_skid_pricing_city" ON "group_skid_pricing"("city_id");

-- CreateIndex
CREATE INDEX "idx_group_skid_pricing_zone" ON "group_skid_pricing"("zone_id");

-- CreateIndex
CREATE INDEX "idx_group_skid_pricing_group" ON "group_skid_pricing"("group_id");