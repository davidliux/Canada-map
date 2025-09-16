// Dynamic Pricing Configuration Types
// For the dynamic-pricing-config specification

/**
 * Base configuration for initial plate pricing
 */
export interface BasePriceConfig {
  plateRange: {
    start: number;  // Starting plate number (e.g., 1)
    end: number;    // Ending plate number (e.g., 2)
  };
  price: number;    // Base price for the range (e.g., 150)
}

/**
 * Increment configuration for additional plates
 */
export interface IncrementConfig {
  startPlate: number;                              // When to start incremental pricing (e.g., 3)
  type: 'fixed' | 'percentage' | 'tiered';        // Type of increment
  value: number;                                   // Increment value (amount for fixed, decimal for percentage)
  tiers?: Array<{
    plateRange: { start: number; end: number };
    incrementValue: number;
  }>;
}

/**
 * Vehicle capacity and overflow configuration
 */
export interface VehicleConfig {
  maxPlatesPerVehicle: number;                    // Maximum plates per vehicle (e.g., 8)
  priceCapPerVehicle?: number;                    // Optional price cap per vehicle
  overflowHandling: 'restart' | 'continue';       // How to handle overflow plates
}

/**
 * Complete pricing rule configuration
 */
export interface PricingRuleConfig {
  id: string;
  regionId: string;
  name: string;
  isActive: boolean;
  
  // Core configuration
  baseConfig: BasePriceConfig;
  incrementConfig: IncrementConfig;
  vehicleConfig: VehicleConfig;
  
  // Additional settings
  currency: 'CAD' | 'USD';
  
  // Metadata
  metadata: {
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    version: number;
  };
}

/**
 * Price tier definition for database storage
 */
export interface PriceTier {
  id: string;
  ruleId: string;
  plateStart: number;
  plateEnd: number;
  basePrice: number;
  incrementType?: 'fixed' | 'percentage' | 'tiered';
  incrementValue?: number;
  sortOrder: number;
  createdAt: string;
}

/**
 * Audit log entry for price changes
 */
export interface PriceAuditEntry {
  id: string;
  ruleId: string;
  userId?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ACTIVATE' | 'DEACTIVATE';
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

/**
 * Price calculation result with breakdown
 */
export interface PriceCalculation {
  plateCount: number;
  totalPrice: number;
  currency: 'CAD' | 'USD';
  vehicles: Array<{
    vehicleNumber: number;
    plateCount: number;
    basePrice: number;
    incrementalPrice: number;
    subtotal: number;
    priceCapped: boolean;
    cappedAmount?: number;
  }>;
  breakdown: {
    basePriceTotal: number;
    incrementalTotal: number;
    totalBeforeCap: number;
    capAdjustment: number;
    finalTotal: number;
  };
  ruleApplied: {
    ruleId: string;
    ruleName: string;
    version: number;
  };
  calculatedAt: string;
}

/**
 * Import/Export format for pricing configurations
 */
export interface PricingConfigExport {
  version: string;
  exportedAt: string;
  exportedBy: string;
  configurations: Array<{
    regionId: string;
    regionName: string;
    rules: PricingRuleConfig[];
  }>;
}

/**
 * Validation result for pricing rules
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  warnings: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

/**
 * Price preview entry for display tables
 */
export interface PricePreviewEntry {
  plateCount: number;
  price: number;
  vehicles: number;
  pricePerVehicle: number[];
  hasAnomaly: boolean;
  anomalyType?: 'price_decrease' | 'unusual_jump' | 'cap_applied';
}

/**
 * Pricing template for quick configuration
 */
export interface PricingTemplate {
  id: string;
  name: string;
  description: string;
  category: 'standard' | 'volume' | 'premium' | 'custom';
  baseConfig: BasePriceConfig;
  incrementConfig: IncrementConfig;
  vehicleConfig: VehicleConfig;
  isDefault: boolean;
}

/**
 * Request/Response types for API endpoints
 */
export namespace PricingAPI {
  export interface GetRulesRequest {
    regionId?: string;
    isActive?: boolean;
    currency?: 'CAD' | 'USD';
    page?: number;
    limit?: number;
  }

  export interface GetRulesResponse {
    rules: PricingRuleConfig[];
    total: number;
    page: number;
    limit: number;
  }

  export interface CalculatePriceRequest {
    regionId: string;
    plateCount: number;
    ruleId?: string;  // Optional specific rule to use
    currency?: 'CAD' | 'USD';
  }

  export interface CalculatePriceResponse extends PriceCalculation {
    exchangeRate?: number;  // If currency conversion was applied
  }

  export interface ImportConfigRequest {
    data: PricingConfigExport;
    targetRegions?: string[];  // Optional specific regions to import to
    overwrite: boolean;
  }

  export interface ImportConfigResponse {
    imported: number;
    skipped: number;
    errors: string[];
    validationResults: ValidationResult[];
  }
}

/**
 * Utility type guards
 */
export const isPricingRuleConfig = (obj: any): obj is PricingRuleConfig => {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.regionId === 'string' &&
    obj.baseConfig &&
    obj.incrementConfig &&
    obj.vehicleConfig;
};

export const isValidIncrementType = (type: string): type is IncrementConfig['type'] => {
  return ['fixed', 'percentage', 'tiered'].includes(type);
};

export const isValidCurrency = (currency: string): currency is 'CAD' | 'USD' => {
  return ['CAD', 'USD'].includes(currency);
};