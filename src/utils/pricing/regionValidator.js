// Region Binding Validation Utilities
// For the city-region binding validation in truck delivery system

/**
 * Validates a complete region binding configuration
 * @param {Object} binding - The region binding configuration to validate
 * @returns {Object} Validation result with isValid flag and errors/warnings
 */
export function validateRegionBinding(binding) {
  const errors = [];
  const warnings = [];

  // Required fields validation
  if (!binding.regionId) {
    errors.push({
      field: 'regionId',
      message: 'Region ID is required',
      code: 'REQUIRED_FIELD'
    });
  }

  if (!binding.cityId) {
    errors.push({
      field: 'cityId', 
      message: 'City ID is required',
      code: 'REQUIRED_FIELD'
    });
  }

  // Validate binding type
  const validBindingTypes = ['exclusive', 'shared', 'dynamic'];
  if (!binding.type || !validBindingTypes.includes(binding.type)) {
    errors.push({
      field: 'type',
      message: `Binding type must be one of: ${validBindingTypes.join(', ')}`,
      code: 'INVALID_BINDING_TYPE'
    });
  }

  // Validate FSA codes
  const fsaValidation = validateFSACodes(binding.fsaCodes);
  errors.push(...fsaValidation.errors);
  warnings.push(...fsaValidation.warnings);

  // Validate region level
  const levelValidation = validateRegionLevel(binding.level);
  errors.push(...levelValidation.errors);
  warnings.push(...levelValidation.warnings);

  // Validate geographic boundaries
  if (binding.boundaries) {
    const boundaryValidation = validateBoundaries(binding.boundaries);
    errors.push(...boundaryValidation.errors);
    warnings.push(...boundaryValidation.warnings);
  }

  // Check for logical consistency
  if (binding.type === 'exclusive' && binding.sharedRegions) {
    errors.push({
      field: 'sharedRegions',
      message: 'Exclusive binding cannot have shared regions',
      code: 'INCONSISTENT_BINDING'
    });
  }

  // Validate active status
  if (typeof binding.isActive !== 'boolean') {
    errors.push({
      field: 'isActive',
      message: 'Active status must be a boolean value',
      code: 'INVALID_ACTIVE_STATUS'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates FSA codes in the binding
 * @param {string[]} fsaCodes - FSA codes to validate
 * @returns {Object} Validation result
 */
export function validateFSACodes(fsaCodes) {
  const errors = [];
  const warnings = [];

  if (!Array.isArray(fsaCodes)) {
    errors.push({
      field: 'fsaCodes',
      message: 'FSA codes must be an array',
      code: 'INVALID_FSA_FORMAT'
    });
    return { errors, warnings };
  }

  if (fsaCodes.length === 0) {
    warnings.push({
      field: 'fsaCodes',
      message: 'No FSA codes specified for region binding',
      code: 'EMPTY_FSA_LIST'
    });
  }

  // Validate individual FSA format
  const fsaPattern = /^[A-Z]\d[A-Z]$/;
  fsaCodes.forEach((fsa, index) => {
    if (typeof fsa !== 'string' || !fsaPattern.test(fsa)) {
      errors.push({
        field: `fsaCodes[${index}]`,
        message: `Invalid FSA code format: ${fsa}. Expected format: A1B`,
        code: 'INVALID_FSA_CODE'
      });
    }
  });

  // Check for duplicates
  const uniqueFSAs = new Set(fsaCodes);
  if (uniqueFSAs.size !== fsaCodes.length) {
    warnings.push({
      field: 'fsaCodes',
      message: 'Duplicate FSA codes found in binding',
      code: 'DUPLICATE_FSA_CODES'
    });
  }

  // Performance warning for large FSA lists
  if (fsaCodes.length > 100) {
    warnings.push({
      field: 'fsaCodes',
      message: 'Large number of FSA codes may impact performance',
      code: 'LARGE_FSA_LIST'
    });
  }

  return { errors, warnings };
}

/**
 * Validates region level assignment
 * @param {number} level - Region level to validate
 * @returns {Object} Validation result
 */
export function validateRegionLevel(level) {
  const errors = [];
  const warnings = [];

  if (typeof level !== 'number') {
    errors.push({
      field: 'level',
      message: 'Region level must be a number',
      code: 'INVALID_LEVEL_TYPE'
    });
    return { errors, warnings };
  }

  if (!Number.isInteger(level)) {
    errors.push({
      field: 'level',
      message: 'Region level must be an integer',
      code: 'NON_INTEGER_LEVEL'
    });
  }

  if (level < 1 || level > 10) {
    errors.push({
      field: 'level',
      message: 'Region level must be between 1 and 10',
      code: 'LEVEL_OUT_OF_RANGE'
    });
  }

  // Level 1 should typically be the core region
  if (level === 1) {
    warnings.push({
      field: 'level',
      message: 'Level 1 should be used for core delivery regions only',
      code: 'CORE_REGION_WARNING'
    });
  }

  return { errors, warnings };
}

/**
 * Validates geographic boundaries
 * @param {Object} boundaries - Boundary data to validate
 * @returns {Object} Validation result
 */
export function validateBoundaries(boundaries) {
  const errors = [];
  const warnings = [];

  if (!boundaries || typeof boundaries !== 'object') {
    errors.push({
      field: 'boundaries',
      message: 'Boundaries must be a valid object',
      code: 'INVALID_BOUNDARY_OBJECT'
    });
    return { errors, warnings };
  }

  // Validate GeoJSON structure
  if (boundaries.type && boundaries.type !== 'FeatureCollection' && boundaries.type !== 'Feature') {
    errors.push({
      field: 'boundaries.type',
      message: 'Boundary type must be FeatureCollection or Feature',
      code: 'INVALID_GEOJSON_TYPE'
    });
  }

  if (boundaries.type === 'FeatureCollection' && !Array.isArray(boundaries.features)) {
    errors.push({
      field: 'boundaries.features',
      message: 'FeatureCollection must have a features array',
      code: 'MISSING_FEATURES'
    });
  }

  if (boundaries.type === 'Feature' && !boundaries.geometry) {
    errors.push({
      field: 'boundaries.geometry',
      message: 'Feature must have geometry',
      code: 'MISSING_GEOMETRY'
    });
  }

  // Validate coordinate system
  if (boundaries.crs && boundaries.crs.properties && boundaries.crs.properties.name) {
    const crs = boundaries.crs.properties.name;
    if (!crs.includes('4326') && !crs.includes('WGS84')) {
      warnings.push({
        field: 'boundaries.crs',
        message: 'Recommended to use WGS84/EPSG:4326 coordinate system',
        code: 'CRS_WARNING'
      });
    }
  }

  return { errors, warnings };
}

/**
 * Validates region binding conflicts
 * @param {Object} binding - The binding to validate
 * @param {Object[]} existingBindings - Array of existing bindings to check against
 * @returns {Object} Validation result with conflict information
 */
export function validateBindingConflicts(binding, existingBindings = []) {
  const errors = [];
  const warnings = [];
  const conflicts = [];

  if (!Array.isArray(existingBindings)) {
    warnings.push({
      field: 'existingBindings',
      message: 'Cannot validate conflicts without existing bindings data',
      code: 'MISSING_CONFLICT_DATA'
    });
    return { errors, warnings, conflicts };
  }

  // Check for FSA code conflicts
  if (binding.fsaCodes && Array.isArray(binding.fsaCodes)) {
    binding.fsaCodes.forEach(fsa => {
      const conflictingBindings = existingBindings.filter(existing => 
        existing.regionId !== binding.regionId &&
        existing.fsaCodes &&
        existing.fsaCodes.includes(fsa) &&
        existing.isActive !== false
      );

      if (conflictingBindings.length > 0) {
        // For exclusive bindings, any conflict is an error
        if (binding.type === 'exclusive') {
          conflicts.push({
            fsaCode: fsa,
            conflictType: 'exclusive_conflict',
            conflictingRegions: conflictingBindings.map(b => b.regionId),
            severity: 'error'
          });
        } else {
          // For shared bindings, log as warning
          conflicts.push({
            fsaCode: fsa,
            conflictType: 'shared_overlap',
            conflictingRegions: conflictingBindings.map(b => b.regionId),
            severity: 'warning'
          });
        }
      }
    });
  }

  // Check for city-region mismatches
  const cityConflicts = existingBindings.filter(existing =>
    existing.regionId === binding.regionId &&
    existing.cityId !== binding.cityId
  );

  if (cityConflicts.length > 0) {
    errors.push({
      field: 'cityId',
      message: `Region ${binding.regionId} is already bound to city ${cityConflicts[0].cityId}`,
      code: 'CITY_REGION_MISMATCH'
    });
  }

  // Add conflict errors/warnings to main arrays
  conflicts.forEach(conflict => {
    if (conflict.severity === 'error') {
      errors.push({
        field: 'fsaCodes',
        message: `FSA code ${conflict.fsaCode} conflicts with regions: ${conflict.conflictingRegions.join(', ')}`,
        code: 'FSA_CONFLICT'
      });
    } else {
      warnings.push({
        field: 'fsaCodes',
        message: `FSA code ${conflict.fsaCode} is shared with regions: ${conflict.conflictingRegions.join(', ')}`,
        code: 'FSA_OVERLAP'
      });
    }
  });

  return {
    errors,
    warnings,
    conflicts,
    hasConflicts: conflicts.length > 0
  };
}

/**
 * Validates import data format for region bindings
 * @param {Object} importData - Import data to validate
 * @returns {Object} Validation result
 */
export function validateBindingImportData(importData) {
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
    warnings.push({
      field: 'version',
      message: 'Import data version not specified',
      code: 'MISSING_VERSION'
    });
  }

  if (!Array.isArray(importData.bindings)) {
    errors.push({
      field: 'bindings',
      message: 'Bindings must be an array',
      code: 'INVALID_FORMAT'
    });
  } else {
    // Validate each binding
    importData.bindings.forEach((binding, index) => {
      const bindingValidation = validateRegionBinding(binding);
      bindingValidation.errors.forEach(error => {
        errors.push({
          ...error,
          field: `bindings[${index}].${error.field}`
        });
      });
      bindingValidation.warnings.forEach(warning => {
        warnings.push({
          ...warning,
          field: `bindings[${index}].${warning.field}`
        });
      });
    });

    // Check for duplicate region IDs
    const regionIds = importData.bindings.map(b => b.regionId).filter(Boolean);
    const uniqueRegionIds = new Set(regionIds);
    if (uniqueRegionIds.size !== regionIds.length) {
      errors.push({
        field: 'bindings',
        message: 'Duplicate region IDs found in import data',
        code: 'DUPLICATE_REGION_IDS'
      });
    }
  }

  if (importData.metadata) {
    // Validate metadata format
    if (importData.metadata.exportedAt && isNaN(new Date(importData.metadata.exportedAt))) {
      warnings.push({
        field: 'metadata.exportedAt',
        message: 'Invalid export timestamp format',
        code: 'INVALID_TIMESTAMP'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates binding performance metrics
 * @param {Object} binding - Binding with performance data
 * @returns {Object} Validation result with performance analysis
 */
export function validateBindingPerformance(binding) {
  const errors = [];
  const warnings = [];
  const analysis = {};

  if (!binding.metrics) {
    warnings.push({
      field: 'metrics',
      message: 'No performance metrics available for analysis',
      code: 'MISSING_METRICS'
    });
    return { errors, warnings, analysis };
  }

  const { metrics } = binding;

  // Validate delivery time
  if (typeof metrics.avgDeliveryTime === 'number') {
    analysis.deliveryTime = {
      value: metrics.avgDeliveryTime,
      status: 'normal'
    };

    if (metrics.avgDeliveryTime > 24) {
      warnings.push({
        field: 'metrics.avgDeliveryTime',
        message: 'Average delivery time exceeds 24 hours',
        code: 'HIGH_DELIVERY_TIME'
      });
      analysis.deliveryTime.status = 'high';
    }

    if (metrics.avgDeliveryTime < 0.5) {
      warnings.push({
        field: 'metrics.avgDeliveryTime',
        message: 'Average delivery time seems unusually low',
        code: 'LOW_DELIVERY_TIME'
      });
      analysis.deliveryTime.status = 'low';
    }
  }

  // Validate capacity utilization
  if (typeof metrics.dailyCapacity === 'number' && typeof metrics.actualDeliveries === 'number') {
    const utilization = metrics.actualDeliveries / metrics.dailyCapacity;
    analysis.utilization = {
      rate: Math.round(utilization * 100),
      status: 'normal'
    };

    if (utilization > 0.95) {
      warnings.push({
        field: 'metrics',
        message: 'Region operating at >95% capacity, consider expansion',
        code: 'HIGH_UTILIZATION'
      });
      analysis.utilization.status = 'high';
    }

    if (utilization < 0.3) {
      warnings.push({
        field: 'metrics',
        message: 'Region operating at <30% capacity, consider optimization',
        code: 'LOW_UTILIZATION'
      });
      analysis.utilization.status = 'low';
    }
  }

  return {
    errors,
    warnings,
    analysis
  };
}

/**
 * Helper function to check if FSA codes overlap between two bindings
 * @param {string[]} fsaCodes1 - First set of FSA codes
 * @param {string[]} fsaCodes2 - Second set of FSA codes
 * @returns {string[]} Array of overlapping FSA codes
 */
function findFSAOverlap(fsaCodes1 = [], fsaCodes2 = []) {
  return fsaCodes1.filter(fsa => fsaCodes2.includes(fsa));
}

/**
 * Validates the overall consistency of all region bindings for a city
 * @param {Object[]} cityBindings - All bindings for a city
 * @returns {Object} Validation result with consistency analysis
 */
export function validateCityBindingConsistency(cityBindings) {
  const errors = [];
  const warnings = [];
  const analysis = {
    totalRegions: cityBindings.length,
    totalFSAs: 0,
    duplicatedFSAs: 0,
    coverageGaps: []
  };

  if (!Array.isArray(cityBindings)) {
    errors.push({
      field: 'cityBindings',
      message: 'City bindings must be an array',
      code: 'INVALID_BINDINGS_FORMAT'
    });
    return { errors, warnings, analysis };
  }

  // Collect all FSA codes
  const allFSAs = [];
  const fsaRegionMap = new Map(); // Track which regions use each FSA

  cityBindings.forEach((binding, index) => {
    if (binding.fsaCodes && Array.isArray(binding.fsaCodes)) {
      binding.fsaCodes.forEach(fsa => {
        allFSAs.push(fsa);
        if (!fsaRegionMap.has(fsa)) {
          fsaRegionMap.set(fsa, []);
        }
        fsaRegionMap.get(fsa).push(binding.regionId || `region_${index}`);
      });
    }
  });

  analysis.totalFSAs = new Set(allFSAs).size;
  analysis.duplicatedFSAs = allFSAs.length - analysis.totalFSAs;

  // Check for FSA conflicts
  fsaRegionMap.forEach((regions, fsa) => {
    if (regions.length > 1) {
      warnings.push({
        field: 'cityBindings',
        message: `FSA ${fsa} is assigned to multiple regions: ${regions.join(', ')}`,
        code: 'FSA_MULTI_ASSIGNMENT'
      });
    }
  });

  // Validate region level distribution
  const levelCounts = {};
  cityBindings.forEach(binding => {
    if (typeof binding.level === 'number') {
      levelCounts[binding.level] = (levelCounts[binding.level] || 0) + 1;
    }
  });

  analysis.levelDistribution = levelCounts;

  // Check for level gaps or unusual distribution
  const levels = Object.keys(levelCounts).map(Number).sort();
  if (levels.length > 0) {
    const maxLevel = Math.max(...levels);
    for (let i = 1; i <= maxLevel; i++) {
      if (!levelCounts[i]) {
        warnings.push({
          field: 'cityBindings',
          message: `Missing region level ${i} in city binding configuration`,
          code: 'LEVEL_GAP'
        });
        analysis.coverageGaps.push(i);
      }
    }
  }

  return {
    errors,
    warnings,
    analysis,
    isConsistent: errors.length === 0
  };
}

export default {
  validateRegionBinding,
  validateFSACodes,
  validateRegionLevel,
  validateBoundaries,
  validateBindingConflicts,
  validateBindingImportData,
  validateBindingPerformance,
  validateCityBindingConsistency
};