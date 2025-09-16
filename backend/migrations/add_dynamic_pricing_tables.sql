-- Dynamic Pricing Configuration Tables Migration
-- Generated for the dynamic-pricing-config specification

-- Create truck_pricing_rules table
CREATE TABLE IF NOT EXISTS truck_pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  base_config JSONB NOT NULL,
  increment_config JSONB NOT NULL,
  vehicle_config JSONB NOT NULL,
  currency VARCHAR(3) DEFAULT 'CAD',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER DEFAULT 1
);

-- Create truck_price_tiers table
CREATE TABLE IF NOT EXISTS truck_price_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES truck_pricing_rules(id) ON DELETE CASCADE,
  plate_start INTEGER NOT NULL,
  plate_end INTEGER NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  increment_type VARCHAR(20),
  increment_value DECIMAL(10,4),
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create truck_price_audit table
CREATE TABLE IF NOT EXISTS truck_price_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES truck_pricing_rules(id) ON DELETE CASCADE,
  user_id UUID,
  action VARCHAR(50) NOT NULL,
  old_value JSONB,
  new_value JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pricing_rules_region ON truck_pricing_rules(region_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_active ON truck_pricing_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_created_at ON truck_pricing_rules(created_at);

CREATE INDEX IF NOT EXISTS idx_price_tiers_rule ON truck_price_tiers(rule_id);
CREATE INDEX IF NOT EXISTS idx_price_tiers_sort ON truck_price_tiers(sort_order);

CREATE INDEX IF NOT EXISTS idx_price_audit_rule ON truck_price_audit(rule_id);
CREATE INDEX IF NOT EXISTS idx_price_audit_user ON truck_price_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_price_audit_created ON truck_price_audit(created_at);
CREATE INDEX IF NOT EXISTS idx_price_audit_action ON truck_price_audit(action);

-- Add unique constraint to prevent duplicate active rules per region
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_rule_per_region 
ON truck_pricing_rules(region_id, name) 
WHERE is_active = true;

-- Add comments for documentation
COMMENT ON TABLE truck_pricing_rules IS 'Stores dynamic pricing configuration rules for plate-based pricing';
COMMENT ON TABLE truck_price_tiers IS 'Defines tiered pricing ranges for different plate counts';
COMMENT ON TABLE truck_price_audit IS 'Audit trail for all pricing rule changes';

COMMENT ON COLUMN truck_pricing_rules.base_config IS 'JSON: { plateRange: { start: 1, end: 2 }, price: 150 }';
COMMENT ON COLUMN truck_pricing_rules.increment_config IS 'JSON: { startPlate: 3, type: "fixed", value: 20, tiers?: [...] }';
COMMENT ON COLUMN truck_pricing_rules.vehicle_config IS 'JSON: { maxPlatesPerVehicle: 8, priceCapPerVehicle?: 1000, overflowHandling: "restart" }';

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_truck_pricing_rules_updated_at 
BEFORE UPDATE ON truck_pricing_rules 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();