// Price Calculation Engine
// For the dynamic-pricing-config specification

/**
 * Core pricing calculation engine
 * Handles all price calculations based on plate count and pricing rules
 */
class PriceCalculationEngine {
  /**
   * Calculate price for a given plate count using a pricing rule
   * @param {number} plateCount - Number of plates
   * @param {Object} rule - Pricing rule configuration
   * @returns {Object} Detailed price calculation
   */
  calculatePrice(plateCount, rule) {
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
        vehiclePrice = this.calculateSingleVehiclePrice(
          platesInVehicle,
          baseConfig,
          incrementConfig
        );
      } else {
        // Continue pricing from where last vehicle left off
        const startPlate = (vehicleNum - 1) * maxPlatesPerVehicle + 1;
        vehiclePrice = this.calculateContinuousPrice(
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
   * @param {number} plateCount - Number of plates in this vehicle
   * @param {Object} baseConfig - Base pricing configuration
   * @param {Object} incrementConfig - Increment configuration
   * @returns {Object} Price breakdown
   */
  calculateSingleVehiclePrice(plateCount, baseConfig, incrementConfig) {
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
      incrementalPrice = this.calculateIncrementalPrice(
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
   * @param {number} startPlate - Starting plate number for this vehicle
   * @param {number} plateCount - Number of plates in this vehicle
   * @param {Object} baseConfig - Base pricing configuration
   * @param {Object} incrementConfig - Increment configuration
   * @returns {Object} Price breakdown
   */
  calculateContinuousPrice(startPlate, plateCount, baseConfig, incrementConfig) {
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
      
      incrementalPrice = this.calculateIncrementalPrice(
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
   * @param {number} plateCount - Number of plates to calculate increment for
   * @param {Object} incrementConfig - Increment configuration
   * @param {number} basePrice - Base price for percentage calculations
   * @param {number} offset - Offset for tiered calculations
   * @returns {number} Incremental price
   */
  calculateIncrementalPrice(plateCount, incrementConfig, basePrice, offset = 0) {
    const { type, value, tiers } = incrementConfig;

    switch (type) {
      case 'fixed':
        return plateCount * value;

      case 'percentage':
        return plateCount * (basePrice * value);

      case 'tiered':
        return this.calculateTieredPrice(plateCount, tiers, offset);

      default:
        throw new Error(`Unknown increment type: ${type}`);
    }
  }

  /**
   * Calculate price using tiered increments
   * @param {number} plateCount - Number of plates
   * @param {Array} tiers - Tier configurations
   * @param {number} offset - Starting offset
   * @returns {number} Total tiered price
   */
  calculateTieredPrice(plateCount, tiers, offset = 0) {
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

  /**
   * Calculate price for multiple vehicles (batch operation)
   * @param {number} plateCount - Total plate count
   * @param {Object} rule - Pricing rule
   * @returns {Object} Multi-vehicle calculation result
   */
  calculateMultiVehicle(plateCount, rule) {
    return this.calculatePrice(plateCount, rule);
  }

  /**
   * Apply price cap to a calculated price
   * @param {number} price - Original price
   * @param {number} cap - Price cap
   * @returns {Object} Capped price with details
   */
  applyPriceCap(price, cap) {
    if (!cap || price <= cap) {
      return {
        originalPrice: price,
        cappedPrice: price,
        capApplied: false,
        savedAmount: 0
      };
    }

    return {
      originalPrice: price,
      cappedPrice: cap,
      capApplied: true,
      savedAmount: price - cap
    };
  }

  /**
   * Get detailed breakdown for a price calculation
   * @param {number} plateCount - Number of plates
   * @param {Object} rule - Pricing rule
   * @returns {Object} Detailed breakdown
   */
  getBreakdown(plateCount, rule) {
    const calculation = this.calculatePrice(plateCount, rule);
    
    return {
      ...calculation,
      details: {
        baseConfiguration: {
          plateRange: `${rule.baseConfig.plateRange.start}-${rule.baseConfig.plateRange.end}`,
          price: rule.baseConfig.price
        },
        incrementConfiguration: {
          startPlate: rule.incrementConfig.startPlate,
          type: rule.incrementConfig.type,
          value: rule.incrementConfig.value
        },
        vehicleConfiguration: {
          maxPlatesPerVehicle: rule.vehicleConfig.maxPlatesPerVehicle,
          priceCapPerVehicle: rule.vehicleConfig.priceCapPerVehicle,
          overflowHandling: rule.vehicleConfig.overflowHandling
        },
        pricePerPlate: calculation.totalPrice / plateCount,
        averagePricePerVehicle: calculation.totalPrice / calculation.vehicles.length
      }
    };
  }

  /**
   * Generate price preview table for a range of plate counts
   * @param {Object} rule - Pricing rule
   * @param {number} maxPlates - Maximum plates to preview (default 20)
   * @returns {Array} Array of preview entries
   */
  generatePreviewTable(rule, maxPlates = 20) {
    const preview = [];
    let previousPrice = 0;

    for (let plateCount = 1; plateCount <= maxPlates; plateCount++) {
      const calculation = this.calculatePrice(plateCount, rule);
      
      // Check for anomalies
      let hasAnomaly = false;
      let anomalyType = null;

      if (plateCount > 1 && calculation.totalPrice < previousPrice) {
        hasAnomaly = true;
        anomalyType = 'price_decrease';
      } else if (plateCount > 1 && calculation.totalPrice > previousPrice * 2) {
        hasAnomaly = true;
        anomalyType = 'unusual_jump';
      } else if (calculation.vehicles.some(v => v.priceCapped)) {
        hasAnomaly = true;
        anomalyType = 'cap_applied';
      }

      preview.push({
        plateCount,
        price: calculation.totalPrice,
        vehicles: calculation.vehicles.length,
        pricePerVehicle: calculation.vehicles.map(v => v.subtotal),
        hasAnomaly,
        anomalyType,
        pricePerPlate: calculation.totalPrice / plateCount
      });

      previousPrice = calculation.totalPrice;
    }

    return preview;
  }

  /**
   * Compare prices between two rules
   * @param {number} plateCount - Plate count to compare
   * @param {Object} rule1 - First pricing rule
   * @param {Object} rule2 - Second pricing rule
   * @returns {Object} Comparison result
   */
  compareRules(plateCount, rule1, rule2) {
    const calc1 = this.calculatePrice(plateCount, rule1);
    const calc2 = this.calculatePrice(plateCount, rule2);

    const difference = calc2.totalPrice - calc1.totalPrice;
    const percentageDiff = (difference / calc1.totalPrice) * 100;

    return {
      plateCount,
      rule1: {
        id: rule1.id,
        name: rule1.name,
        price: calc1.totalPrice,
        vehicles: calc1.vehicles.length
      },
      rule2: {
        id: rule2.id,
        name: rule2.name,
        price: calc2.totalPrice,
        vehicles: calc2.vehicles.length
      },
      difference,
      percentageDifference: percentageDiff,
      cheaper: difference < 0 ? 'rule2' : difference > 0 ? 'rule1' : 'equal'
    };
  }

  /**
   * Optimize pricing rule for target revenue
   * @param {Object} rule - Base pricing rule
   * @param {number} targetRevenue - Target revenue per average order
   * @param {number} averagePlateCount - Average plate count per order
   * @returns {Object} Optimized rule suggestion
   */
  optimizeForRevenue(rule, targetRevenue, averagePlateCount) {
    const currentCalc = this.calculatePrice(averagePlateCount, rule);
    const currentRevenue = currentCalc.totalPrice;
    const adjustment = targetRevenue / currentRevenue;

    return {
      current: {
        revenue: currentRevenue,
        rule: rule
      },
      suggested: {
        basePrice: Math.round(rule.baseConfig.price * adjustment * 100) / 100,
        incrementValue: rule.incrementConfig.type === 'fixed' 
          ? Math.round(rule.incrementConfig.value * adjustment * 100) / 100
          : rule.incrementConfig.value * adjustment,
        targetRevenue,
        adjustmentFactor: adjustment
      }
    };
  }
}

// Create singleton instance
const priceCalculationEngine = new PriceCalculationEngine();

export default priceCalculationEngine;
export { PriceCalculationEngine };