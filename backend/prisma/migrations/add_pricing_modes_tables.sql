-- CreateTable for pricing_modes
CREATE TABLE "pricing_modes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "city_id" VARCHAR(50) NOT NULL,
    "zone_id" VARCHAR(50) NOT NULL,
    "mode_type" VARCHAR(50) NOT NULL,
    "config" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(100),

    CONSTRAINT "pricing_modes_pkey" PRIMARY KEY ("id")
);

-- CreateTable for pricing_rules
CREATE TABLE "pricing_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "mode_id" UUID NOT NULL,
    "rule_type" VARCHAR(50) NOT NULL,
    "min_quantity" INTEGER,
    "max_quantity" INTEGER,
    "price" DECIMAL(10,2),
    "price_per_unit" DECIMAL(10,2),
    "discount_percent" DECIMAL(5,2),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pricing_modes_city_id_zone_id_mode_type_key" ON "pricing_modes"("city_id", "zone_id", "mode_type");

-- CreateIndex
CREATE INDEX "idx_pricing_modes_city" ON "pricing_modes"("city_id");

-- CreateIndex
CREATE INDEX "idx_pricing_modes_zone" ON "pricing_modes"("zone_id");

-- CreateIndex
CREATE INDEX "idx_pricing_modes_active" ON "pricing_modes"("is_active");

-- CreateIndex
CREATE INDEX "idx_pricing_rules_mode" ON "pricing_rules"("mode_id");

-- CreateIndex
CREATE INDEX "idx_pricing_rules_type" ON "pricing_rules"("rule_type");

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_mode_id_fkey" FOREIGN KEY ("mode_id") REFERENCES "pricing_modes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pricing_modes_updated_at BEFORE UPDATE ON "pricing_modes"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();