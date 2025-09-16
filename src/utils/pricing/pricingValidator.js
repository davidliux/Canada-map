// Pricing Validation Utilities
// For the dynamic-pricing-config specification

/**
 * Validates a complete pricing rule configuration
 * @param {Object} config - The pricing rule configuration to validate
 * @returns {Object} Validation result with isValid flag and errors/warnings
 */
export function validatePricingRule(config) {
  const errors = [];
  const warnings = [];

  // Required fields validation
  if (!config.regionId) {
    errors.push({
      field: 'regionId',
      message: 'Region ID is required',
      code: 'REQUIRED_FIELD'
    });
  }

  if (!config.name || config.name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: 'Rule name is required',
      code: 'REQUIRED_FIELD'
    });
  }

  // Validate base configuration
  const baseValidation = validateBaseConfig(config.baseConfig);
  errors.push(...baseValidation.errors);
  warnings.push(...baseValidation.warnings);

  // Validate increment configuration
  const incrementValidation = validateIncrementConfig(config.incrementConfig);
  errors.push(...incrementValidation.errors);
  warnings.push(...incrementValidation.warnings);

  // Validate vehicle configuration
  const vehicleValidation = validateVehicleConfig(config.vehicleConfig);
  errors.push(...vehicleValidation.errors);
  warnings.push(...vehicleValidation.warnings);

  // Validate currency
  if (config.currency && !['CAD', 'USD'].includes(config.currency)) {
    errors.push({
      field: 'currency',
      message: 'Currency must be CAD or USD',
      code: 'INVALID_CURRENCY'
    });
  }

  // Check for logical consistency
  if (config.baseConfig && config.incrementConfig) {
    const consistency = checkConfigConsistency(config.baseConfig, config.incrementConfig);
    errors.push(...consistency.errors);
    warnings.push(...consistency.warnings);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates base pricing configuration
 * @param {Object} baseConfig - Base pricing configuration
 * @returns {Object} Validation result
 */
export function validateBaseConfig(baseConfig) {
  const errors = [];
  const warnings = [];

  if (!baseConfig) {
    errors.push({
      field: 'baseConfig',
      message: 'Base configuration is required',
      code: 'REQUIRED_FIELD'
    });
    return { errors, warnings };
  }

  // Validate plate range
  if (!baseConfig.plateRange) {
    errors.push({
      field: 'baseConfig.plateRange',
      message: 'Plate range is required',
      code: 'REQUIRED_FIELD'
    });
  } else {
    const { start, end } = baseConfig.plateRange;
    
    if (typeof start !== 'number' || start < 1) {
      errors.push({
        field: 'baseConfig.plateRange.start',
        message: 'Start plate must be a positive number',
        code: 'INVALID_RANGE'
      });
    }
    
    if (typeof end !== 'number' || end < 1) {
      errors.push({
        field: 'baseConfig.plateRange.end',
        message: 'End plate must be a positive number',
        code: 'INVALID_RANGE'
      });
    }
    
    if (start && end && start > end) {
      errors.push({
        field: 'baseConfig.plateRange',
        message: 'Start plate cannot be greater than end plate',
        code: 'INVALID_RANGE'
      });
    }

    if (end > 100) {
      warnings.push({
        field: 'baseConfig.plateRange.end',
        message: 'Base range covers more than 100 plates, which is unusual',
        code: 'UNUSUAL_RANGE'
      });
    }
  }

  // Validate base price
  if (typeof baseConfig.price !== 'number' || baseConfig.price < 0) {
    errors.push({
      field: 'baseConfig.price',
      message: 'Base price must be a non-negative number',
      code: 'INVALID_PRICE'
    });
  } else if (baseConfig.price === 0) {
    warnings.push({
      field: 'baseConfig.price',
      message: 'Base price is set to 0, which means free service',
      code: 'ZERO_PRICE'
    });
  } else if (baseConfig.price > 10000) {
    warnings.push({
      field: 'baseConfig.price',
      message: 'Base price exceeds $10,000, please verify this is correct',
      code: 'HIGH_PRICE'
    });
  }

  return { errors, warnings };
}

/**
 * Validates increment configuration
 * @param {Object} incrementConfig - Increment configuration
 * @returns {Object} Validation result
 */
export function validateIncrementConfig(incrementConfig) {
  const errors = [];
  const warnings = [];

  if (!incrementConfig) {
    errors.push({
      field: 'incrementConfig',
      message: 'Increment configuration is required',
      code: 'REQUIRED_FIELD'
    });
    return { errors, warnings };
  }

  // Validate start plate
  if (typeof incrementConfig.startPlate !== 'number' || incrementConfig.startPlate < 1) {
    errors.push({
      field: 'incrementConfig.startPlate',
      message: 'Start plate for increments must be a positive number',
      code: 'INVALID_START_PLATE'
    });
  }

  // Validate increment type
  const validTypes = ['fixed', 'percentage', 'tiered'];
  if (!validTypes.includes(incrementConfig.type)) {
    errors.push({
      field: 'incrementConfig.type',
      message: `Increment type must be one of: ${validTypes.join(', ')}`,
      code: 'INVALID_INCREMENT_TYPE'
    });
  }

  // Validate increment value based on type
  if (incrementConfig.type === 'fixed') {
    if (typeof incrementConfig.value !== 'number' || incrementConfig.value < 0) {
      errors.push({
        field: 'incrementConfig.value',
        message: 'Fixed increment value must be a non-negative number',
        code: 'INVALID_INCREMENT_VALUE'
      });
    } else if (incrementConfig.value > 1000) {
      warnings.push({
        field: 'incrementConfig.value',
        message: 'Fixed increment exceeds $1,000 per plate',
        code: 'HIGH_INCREMENT'
      });
    }
  } else if (incrementConfig.type === 'percentage') {
    if (typeof incrementConfig.value !== 'number' || incrementConfig.value < 0 || incrementConfig.value > 1) {
      errors.push({
        field: 'incrementConfig.value',
        message: 'Percentage increment must be between 0 and 1 (0% to 100%)',
        code: 'INVALID_PERCENTAGE'
      });
    } else if (incrementConfig.value > 0.5) {
      warnings.push({
        field: 'incrementConfig.value',
        message: 'Percentage increment exceeds 50%, which may result in very high prices',
        code: 'HIGH_PERCENTAGE'
      });
    }
  } else if (incrementConfig.type === 'tiered' && incrementConfig.tiers) {
    // Validate tiered increments
    const tierValidation = validateTiers(incrementConfig.tiers);
    errors.push(...tierValidation.errors);
    warnings.push(...tierValidation.warnings);
  }

  return { errors, warnings };
}

/**
 * Validates tiered pricing configuration
 * @param {Array} tiers - Array of tier configurations
 * @returns {Object} Validation result
 */
export function validateTiers(tiers) {
  const errors = [];
  const warnings = [];

  if (!Array.isArray(tiers)) {
    errors.push({
      field: 'incrementConfig.tiers',
      message: 'Tiers must be an array',
      code: 'INVALID_TIERS'
    });
    return { errors, warnings };
  }

  if (tiers.length === 0) {
    errors.push({
      field: 'incrementConfig.tiers',
      message: 'At least one tier is required for tiered pricing',
      code: 'EMPTY_TIERS'
    });
  }

  // Check for overlapping tiers
  for (let i = 0; i < tiers.length; i++) {
    const tier = tiers[i];
    
    if (!tier.plateRange || typeof tier.plateRange.start !== 'number' || typeof tier.plateRange.end !== 'number') {
      errors.push({
        field: `incrementConfig.tiers[${i}].plateRange`,
        message: 'Each tier must have a valid plate range',
        code: 'INVALID_TIER_RANGE'
      });
      continue;
    }

    if (tier.plateRange.start > tier.plateRange.end) {
      errors.push({
        field: `incrementConfig.tiers[${i}].plateRange`,
        message: 'Tier start cannot be greater than end',
        code: 'INVALID_TIER_RANGE'
      });
    }

    if (typeof tier.incrementValue !== 'number' || tier.incrementValue < 0) {
      errors.push({
        field: `incrementConfig.tiers[${i}].incrementValue`,
        message: 'Tier increment value must be a non-negative number',
        code: 'INVALID_TIER_VALUE'
      });
    }

    // Check for overlaps with other tiers
    for (let j = i + 1; j < tiers.length; j++) {
      const otherTier = tiers[j];
      if (otherTier.plateRange && checkRangeOverlap(tier.plateRange, otherTier.plateRange)) {
        errors.push({
          field: `incrementConfig.tiers`,
          message: `Tiers ${i} and ${j} have overlapping plate ranges`,
          code: 'OVERLAPPING_TIERS'
        });
      }
    }
  }

  return { errors, warnings };
}

/**
 * Validates vehicle configuration
 * @param {Object} vehicleConfig - Vehicle configuration
 * @returns {Object} Validation result
 */
export function validateVehicleConfig(vehicleConfig) {
  const errors = [];
  const warnings = [];

  if (!vehicleConfig) {
    errors.push({
      field: 'vehicleConfig',
      message: 'Vehicle configuration is required',
      code: 'REQUIRED_FIELD'
    });
    return { errors, warnings };
  }

  // Validate max plates per vehicle
  if (typeof vehicleConfig.maxPlatesPerVehicle !== 'number' || vehicleConfig.maxPlatesPerVehicle < 1) {
    errors.push({
      field: 'vehicleConfig.maxPlatesPerVehicle',
      message: 'Max plates per vehicle must be a positive number',
      code: 'INVALID_MAX_PLATES'
    });
  } else if (vehicleConfig.maxPlatesPerVehicle > 100) {
    warnings.push({
      field: 'vehicleConfig.maxPlatesPerVehicle',
      message: 'Max plates per vehicle exceeds 100, which is unusually high',
      code: 'HIGH_MAX_PLATES'
    });
  }

  // Validate price cap if present
  if (vehicleConfig.priceCapPerVehicle !== undefined) {
    if (typeof vehicleConfig.priceCapPerVehicle !== 'number' || vehicleConfig.priceCapPerVehicle < 0) {
      errors.push({
        field: 'vehicleConfig.priceCapPerVehicle',
        message: 'Price cap must be a non-negative number',
        code: 'INVALID_PRICE_CAP'
      });
    } else if (vehicleConfig.priceCapPerVehicle === 0) {
      warnings.push({
        field: 'vehicleConfig.priceCapPerVehicle',
        message: 'Price cap is set to 0, which will result in free service',
        code: 'ZERO_PRICE_CAP'
      });
    }
  }

  // Validate overflow handling
  const validOverflowTypes = ['restart', 'continue'];
  if (!validOverflowTypes.includes(vehicleConfig.overflowHandling)) {
    errors.push({
      field: 'vehicleConfig.overflowHandling',
      message: `Overflow handling must be one of: ${validOverflowTypes.join(', ')}`,
      code: 'INVALID_OVERFLOW_HANDLING'
    });
  }

  return { errors, warnings };
}

/**
 * Checks consistency between base and increment configurations
 * @param {Object} baseConfig - Base configuration
 * @param {Object} incrementConfig - Increment configuration
 * @returns {Object} Validation result
 */
export function checkConfigConsistency(baseConfig, incrementConfig) {
  const errors = [];
  const warnings = [];

  if (baseConfig.plateRange && incrementConfig.startPlate) {
    const { end } = baseConfig.plateRange;
    const { startPlate } = incrementConfig;

    if (startPlate <= end) {
      errors.push({
        field: 'incrementConfig.startPlate',
        message: `Increment start plate (${startPlate}) should be after base range end (${end})`,
        code: 'INCONSISTENT_CONFIG'
      });
    } else if (startPlate > end + 1) {
      warnings.push({
        field: 'incrementConfig.startPlate',
        message: `Gap detected between base range end (${end}) and increment start (${startPlate})`,
        code: 'CONFIG_GAP'
      });
    }
  }

  return { errors, warnings };
}

/**
 * Validates price progression for anomalies
 * @param {Array} prices - Array of calculated prices for different plate counts
 * @returns {Object} Validation result with anomalies
 */
export function validatePriceProgression(prices) {
  const anomalies = [];

  for (let i = 1; i < prices.length; i++) {
    const current = prices[i];
    const previous = prices[i - 1];

    // Check for price decrease
    if (current.price < previous.price) {
      anomalies.push({
        plateCount: current.plateCount,
        type: 'price_decrease',
        message: `Price decreases from ${previous.plateCount} plates ($${previous.price}) to ${current.plateCount} plates ($${current.price})`,
        severity: 'error'
      });
    }

    // Check for unusual jumps (more than 100% increase)
    if (current.price > previous.price * 2) {
      anomalies.push({
        plateCount: current.plateCount,
        type: 'unusual_jump',
        message: `Price more than doubles from ${previous.plateCount} plates to ${current.plateCount} plates`,
        severity: 'warning'
      });
    }

    // Check if price cap is being applied
    if (current.priceCapped) {
      anomalies.push({
        plateCount: current.plateCount,
        type: 'cap_applied',
        message: `Price cap applied at ${current.plateCount} plates`,
        severity: 'info'
      });
    }
  }

  return {
    hasAnomalies: anomalies.length > 0,
    anomalies
  };
}

/**
 * Validates import data format
 * @param {Object} importData - Import data to validate
 * @returns {Object} Validation result
 */
export function validateImportData(importData) {
  const errors = [];
  const warnings = [];

  if (!importData) {
    errors.push({
      field: 'importData',
      message: 'Import data is required',
      code: 'MISSING_DATA'
    });
    return { isValid: false, errors, warnings };
  }

  if (!importData.version) {
    errors.push({
      field: 'version',
      message: 'Import data version is required',
      code: 'MISSING_VERSION'
    });
  }

  if (!Array.isArray(importData.configurations)) {
    errors.push({
      field: 'configurations',
      message: 'Configurations must be an array',
      code: 'INVALID_FORMAT'
    });
  } else {
    // Validate each configuration
    importData.configurations.forEach((config, index) => {
      if (!config.regionId) {
        errors.push({
          field: `configurations[${index}].regionId`,
          message: 'Region ID is required for each configuration',
          code: 'MISSING_REGION'
        });
      }

      if (!Array.isArray(config.rules)) {
        errors.push({
          field: `configurations[${index}].rules`,
          message: 'Rules must be an array',
          code: 'INVALID_RULES'
        });
      } else {
        // Validate each rule
        config.rules.forEach((rule, ruleIndex) => {
          const ruleValidation = validatePricingRule(rule);
          ruleValidation.errors.forEach(error => {
            errors.push({
              ...error,
              field: `configurations[${index}].rules[${ruleIndex}].${error.field}`
            });
          });
          ruleValidation.warnings.forEach(warning => {
            warnings.push({
              ...warning,
              field: `configurations[${index}].rules[${ruleIndex}].${warning.field}`
            });
          });
        });
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Helper function to check if two ranges overlap
 * @param {Object} range1 - First range with start and end
 * @param {Object} range2 - Second range with start and end
 * @returns {boolean} True if ranges overlap
 */
function checkRangeOverlap(range1, range2) {
  return range1.start <= range2.end && range2.start <= range1.end;
}

/**
 * Validates a single plate count input
 * @param {number} plateCount - Plate count to validate
 * @returns {Object} Validation result
 */
export function validatePlateCount(plateCount) {
  if (typeof plateCount !== 'number' || !Number.isInteger(plateCount)) {
    return {
      isValid: false,
      error: 'Plate count must be an integer'
    };
  }

  if (plateCount < 1) {
    return {
      isValid: false,
      error: 'Plate count must be at least 1'
    };
  }

  if (plateCount > 1000) {
    return {
      isValid: false,
      error: 'Plate count exceeds maximum limit of 1000'
    };
  }

  return { isValid: true };
}

export default {
  validatePricingRule,
  validateBaseConfig,
  validateIncrementConfig,
  validateVehicleConfig,
  validateTiers,
  checkConfigConsistency,
  validatePriceProgression,
  validateImportData,
  validatePlateCount
};