// Price Calculation Helper for Backend
// Server-side implementation of the price calculation engine

/**
 * Calculate price for a given plate count using a pricing rule
 * @param {number} plateCount - Number of plates
 * @param {Object} rule - Pricing rule from database
 * @returns {Object} Detailed price calculation
 */
function calculatePrice(plateCount, rule) {
  if (!rule || !rule.baseConfig || !rule.incrementConfig || !rule.vehicleConfig) {
    throw new Error('Invalid pricing rule configuration');
  }

  const { baseConfig, incrementConfig, vehicleConfig } = rule;
  const { maxPlatesPerVehicle, priceCapPerVehicle, overflowHandling } = vehicleConfig;

  // Calculate how many vehicles are needed
  const vehicleCount = Math.ceil(plateCount / maxPlatesPerVehicle);
  const vehicles = [];
  let remainingPlates = plateCount;
  let totalPrice = 0;

  for (let vehicleNum = 1; vehicleNum <= vehicleCount; vehicleNum++) {
    const platesInVehicle = Math.min(remainingPlates, maxPlatesPerVehicle);
    
    // Calculate price for this vehicle
    let vehiclePrice;
    if (overflowHandling === 'restart') {
      // Each vehicle starts from base pricing
      vehiclePrice = calculateSingleVehiclePrice(
        platesInVehicle,
        baseConfig,
        incrementConfig
      );
    } else {
      // Continue pricing from where last vehicle left off
      const startPlate = (vehicleNum - 1) * maxPlatesPerVehicle + 1;
      vehiclePrice = calculateContinuousPrice(
        startPlate,
        platesInVehicle,
        baseConfig,
        incrementConfig
      );
    }

    // Apply price cap if configured
    let priceCapped = false;
    let cappedAmount = 0;
    if (priceCapPerVehicle && vehiclePrice.total > priceCapPerVehicle) {
      cappedAmount = vehiclePrice.total - priceCapPerVehicle;
      vehiclePrice.total = priceCapPerVehicle;
      priceCapped = true;
    }

    vehicles.push({
      vehicleNumber: vehicleNum,
      plateCount: platesInVehicle,
      basePrice: vehiclePrice.basePrice,
      incrementalPrice: vehiclePrice.incrementalPrice,
      subtotal: vehiclePrice.total,
      priceCapped,
      cappedAmount
    });

    totalPrice += vehiclePrice.total;
    remainingPlates -= platesInVehicle;
  }

  // Calculate breakdown
  const basePriceTotal = vehicles.reduce((sum, v) => sum + v.basePrice, 0);
  const incrementalTotal = vehicles.reduce((sum, v) => sum + v.incrementalPrice, 0);
  const capAdjustment = vehicles.reduce((sum, v) => sum + (v.cappedAmount || 0), 0);

  return {
    plateCount,
    totalPrice,
    currency: rule.currency || 'CAD',
    vehicles,
    breakdown: {
      basePriceTotal,
      incrementalTotal,
      totalBeforeCap: basePriceTotal + incrementalTotal,
      capAdjustment: -capAdjustment,
      finalTotal: totalPrice
    },
    ruleApplied: {
      ruleId: rule.id,
      ruleName: rule.name,
      version: rule.version || 1
    },
    calculatedAt: new Date().toISOString()
  };
}

/**
 * Calculate price for plates in a single vehicle (restart mode)
 */
function calculateSingleVehiclePrice(plateCount, baseConfig, incrementConfig) {
  let basePrice = 0;
  let incrementalPrice = 0;

  // Calculate base price
  const basePlatesUsed = Math.min(plateCount, baseConfig.plateRange.end);
  if (plateCount >= baseConfig.plateRange.start) {
    basePrice = baseConfig.price;
  }

  // Calculate incremental price if applicable
  if (plateCount >= incrementConfig.startPlate) {
    const incrementalPlates = plateCount - incrementConfig.startPlate + 1;
    incrementalPrice = calculateIncrementalPrice(
      incrementalPlates,
      incrementConfig,
      baseConfig.price
    );
  }

  return {
    basePrice,
    incrementalPrice,
    total: basePrice + incrementalPrice
  };
}

/**
 * Calculate continuous price (for overflow handling = 'continue')
 */
function calculateContinuousPrice(startPlate, plateCount, baseConfig, incrementConfig) {
  let basePrice = 0;
  let incrementalPrice = 0;
  const endPlate = startPlate + plateCount - 1;

  // Check if any plates fall in base range
  if (startPlate <= baseConfig.plateRange.end) {
    // Some plates are in base range
    const basePlatesInRange = Math.min(
      baseConfig.plateRange.end - startPlate + 1,
      plateCount
    );
    if (basePlatesInRange > 0) {
      basePrice = baseConfig.price * (basePlatesInRange / (baseConfig.plateRange.end - baseConfig.plateRange.start + 1));
    }
  }

  // Calculate incremental price
  if (endPlate >= incrementConfig.startPlate) {
    const incrementStartPlate = Math.max(startPlate, incrementConfig.startPlate);
    const incrementalPlates = endPlate - incrementStartPlate + 1;
    
    incrementalPrice = calculateIncrementalPrice(
      incrementalPlates,
      incrementConfig,
      baseConfig.price,
      incrementStartPlate - incrementConfig.startPlate
    );
  }

  return {
    basePrice,
    incrementalPrice,
    total: basePrice + incrementalPrice
  };
}

/**
 * Calculate incremental price based on configuration
 */
function calculateIncrementalPrice(plateCount, incrementConfig, basePrice, offset = 0) {
  const { type, value, tiers } = incrementConfig;

  switch (type) {
    case 'fixed':
      return plateCount * value;

    case 'percentage':
      return plateCount * (basePrice * value);

    case 'tiered':
      return calculateTieredPrice(plateCount, tiers, offset);

    default:
      throw new Error(`Unknown increment type: ${type}`);
  }
}

/**
 * Calculate price using tiered increments
 */
function calculateTieredPrice(plateCount, tiers, offset = 0) {
  if (!tiers || tiers.length === 0) {
    return 0;
  }

  let totalPrice = 0;
  let remainingPlates = plateCount;
  let currentPlate = offset + 1;

  // Sort tiers by start plate
  const sortedTiers = [...tiers].sort((a, b) => a.plateRange.start - b.plateRange.start);

  for (const tier of sortedTiers) {
    if (remainingPlates <= 0) break;

    const tierStart = Math.max(tier.plateRange.start, currentPlate);
    const tierEnd = tier.plateRange.end;

    if (currentPlate > tierEnd) continue;

    const platesInTier = Math.min(
      remainingPlates,
      tierEnd - tierStart + 1
    );

    if (platesInTier > 0) {
      totalPrice += platesInTier * tier.incrementValue;
      remainingPlates -= platesInTier;
      currentPlate += platesInTier;
    }
  }

  // If there are remaining plates not covered by tiers, use last tier's value
  if (remainingPlates > 0 && sortedTiers.length > 0) {
    const lastTier = sortedTiers[sortedTiers.length - 1];
    totalPrice += remainingPlates * lastTier.incrementValue;
  }

  return totalPrice;
}

module.exports = {
  calculatePrice,
  calculateSingleVehiclePrice,
  calculateContinuousPrice,
  calculateIncrementalPrice,
  calculateTieredPrice
};