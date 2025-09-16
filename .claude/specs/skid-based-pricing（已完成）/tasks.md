# Implementation Plan - Skid-Based Dynamic Pricing System

## Task Overview
Transform the existing weight-based pricing system into a skid-based pricing model through incremental, atomic tasks. Each task is designed to be completed in 15-30 minutes and touches 1-3 related files maximum.

## Steering Document Compliance
Tasks follow structure.md conventions for file organization and tech.md patterns for React/JavaScript implementation. All new components will be placed under `src/components/pricing/skid/` and utilities under `src/utils/pricing/`.

## Atomic Task Requirements
**Each task meets these criteria for optimal agent execution:**
- **File Scope**: Touches 1-3 related files maximum
- **Time Boxing**: Completable in 15-30 minutes
- **Single Purpose**: One testable outcome per task
- **Specific Files**: Must specify exact files to create/modify
- **Agent-Friendly**: Clear input/output with minimal context switching

## Tasks

### Data Model Setup

- [ ] 1. Create skid pricing type definitions in src/types/skidPricing.js
  - File: src/types/skidPricing.js (new)
  - Define SkidPriceConfiguration object schema
  - Define ZonePriceMatrix structure
  - Define AccessorialCharge types
  - Purpose: Establish data structures for skid pricing
  - _Leverage: src/types/pricing.ts structure_
  - _Requirements: 1.1, 2.1_

- [ ] 2. Create skid pricing storage keys in src/utils/storage/skidPricingKeys.js
  - File: src/utils/storage/skidPricingKeys.js (new)
  - Define localStorage key patterns for skid pricing
  - Export key generation functions
  - Purpose: Centralize storage key management
  - _Leverage: src/utils/unifiedStorage.js patterns_
  - _Requirements: 1.3_

### Storage Layer

- [ ] 3. Create skid pricing storage service in src/utils/storage/skidPricingStorage.js
  - File: src/utils/storage/skidPricingStorage.js (new)
  - Implement get/set methods for skid configurations
  - Add data validation on save
  - Purpose: Manage skid pricing data persistence
  - _Leverage: src/utils/unifiedStorage.js, src/utils/storage/cityStorage.js_
  - _Requirements: 1.3, 2.3_

- [ ] 4. Add skid pricing cache manager in src/utils/pricing/skidPriceCache.js
  - File: src/utils/pricing/skidPriceCache.js (new)
  - Implement LRU cache with 100ms TTL
  - Add cache invalidation methods
  - Purpose: Optimize price calculation performance
  - _Leverage: src/utils/performance.js_
  - _Requirements: 5.1_

### Calculation Engine

- [ ] 5. Create base skid calculation engine in src/utils/pricing/skidCalculator.js
  - File: src/utils/pricing/skidCalculator.js (new)
  - Extend PriceCalculationEngine class
  - Implement calculatePrice method for skids
  - Purpose: Core skid price calculation logic
  - _Leverage: src/utils/pricing/priceCalculationEngine.js_
  - _Requirements: 1.3, 5.1_

- [ ] 6. Add zone price calculation to skidCalculator.js
  - File: src/utils/pricing/skidCalculator.js (modify)
  - Add zone multiplier logic
  - Implement zone price validation
  - Purpose: Support multi-zone pricing
  - _Leverage: existing calculatePrice method_
  - _Requirements: 2.1, 2.5_

- [ ] 7. Add incremental pricing for 16+ skids in skidCalculator.js
  - File: src/utils/pricing/skidCalculator.js (modify)
  - Implement 16+ pricing rule
  - Add skid count validation
  - Purpose: Handle overflow skid pricing
  - _Leverage: existing calculation patterns_
  - _Requirements: 1.4_

### Zone Management

- [ ] 8. Create zone price manager in src/utils/pricing/zonePriceManager.js
  - File: src/utils/pricing/zonePriceManager.js (new)
  - Implement getZonePrice method
  - Add validateZonePricing method
  - Purpose: Manage zone-specific pricing logic
  - _Leverage: src/utils/storage/cityStorage.js_
  - _Requirements: 2.1, 2.5_

- [ ] 9. Add zone progression validation in zonePriceManager.js
  - File: src/utils/pricing/zonePriceManager.js (modify)
  - Implement ensurePriceProgression method
  - Add warning generation for inconsistencies
  - Purpose: Validate zone price relationships
  - _Requirements: 2.5_

### Accessorial Charges

- [ ] 10. Create accessorial charge manager in src/utils/pricing/accessorialManager.js
  - File: src/utils/pricing/accessorialManager.js (new)
  - Define charge types (TAILGATE, RESIDENTIAL, etc.)
  - Implement getAvailableCharges method
  - Purpose: Manage additional delivery charges
  - _Leverage: src/utils/quotationGenerator.js patterns_
  - _Requirements: 4.1, 4.2_

- [ ] 11. Add charge calculation methods to accessorialManager.js
  - File: src/utils/pricing/accessorialManager.js (modify)
  - Implement calculateCharges method
  - Add percentage vs fixed charge logic
  - Purpose: Calculate total accessorial charges
  - _Requirements: 4.2, 4.3_

- [ ] 12. Add audit logging for accessorial changes in accessorialManager.js
  - File: src/utils/pricing/accessorialManager.js (modify)
  - Implement getChargeHistory method
  - Add change tracking with timestamps
  - Purpose: Maintain audit trail for charges
  - _Requirements: 4.5_

### Service Layer

- [ ] 13. Create skid pricing service in src/services/skidPricingService.js
  - File: src/services/skidPricingService.js (new)
  - Extend PricingService class
  - Implement getSkidPricing method
  - Purpose: Service layer for skid pricing operations
  - _Leverage: src/services/pricingService.js_
  - _Requirements: 1.1, 2.1_

- [ ] 14. Add CRUD operations to skidPricingService.js
  - File: src/services/skidPricingService.js (modify)
  - Implement saveSkidPricing method
  - Add deleteSkidPricing method
  - Purpose: Complete CRUD functionality
  - _Leverage: existing service patterns_
  - _Requirements: 1.3_

- [ ] 15. Add calculation endpoint to skidPricingService.js
  - File: src/services/skidPricingService.js (modify)
  - Implement calculateQuote method
  - Integrate with cache and calculation engine
  - Purpose: Expose price calculation API
  - _Leverage: skidCalculator.js, skidPriceCache.js_
  - _Requirements: 5.1, 5.3_

### UI Components - Matrix Grid

- [ ] 16. Create skid pricing matrix component structure in src/components/pricing/skid/SkidPricingMatrix.jsx
  - File: src/components/pricing/skid/SkidPricingMatrix.jsx (new)
  - Create component skeleton with props interface
  - Add basic grid layout structure
  - Purpose: Excel-like pricing grid foundation
  - _Leverage: src/components/pricing/PricePreviewTable.jsx_
  - _Requirements: 1.1, 2.1_

- [x] 17. Add grid header row for zones in SkidPricingMatrix.jsx
  - File: src/components/pricing/skid/SkidPricingMatrix.jsx (modify)
  - Create zone column headers (Zone 1-5)
  - Add zone highlighting on hover
  - Purpose: Display zone columns
  - _Requirements: 2.1, 2.2_

- [ ] 18. Add skid count rows (1-16+) in SkidPricingMatrix.jsx
  - File: src/components/pricing/skid/SkidPricingMatrix.jsx (modify)
  - Generate rows for skids 1-16 and 16+
  - Add row labels and styling
  - Purpose: Display skid count rows
  - _Requirements: 1.2_

- [ ] 19. Create editable price cells in SkidPricingMatrix.jsx
  - File: src/components/pricing/skid/SkidPricingMatrix.jsx (modify)
  - Implement cell edit functionality
  - Add input validation for prices
  - Purpose: Allow price editing in grid
  - _Leverage: src/components/pricing/EnhancedPricingRuleEditor.jsx patterns_
  - _Requirements: 1.3, 2.4_

- [ ] 20. Add keyboard navigation to SkidPricingMatrix.jsx
  - File: src/components/pricing/skid/SkidPricingMatrix.jsx (modify)
  - Implement arrow key navigation
  - Add Tab/Shift+Tab support
  - Purpose: Excel-like keyboard interaction
  - _Leverage: src/components/pricing/EnhancedPricingRuleEditor.jsx keyboard handling_
  - _Requirements: 2.4_

- [ ] 21. Add bulk copy/paste support in SkidPricingMatrix.jsx
  - File: src/components/pricing/skid/SkidPricingMatrix.jsx (modify)
  - Implement clipboard API integration
  - Parse pasted data from Excel
  - Purpose: Enable bulk data entry
  - _Requirements: 2.4_

- [ ] 22. Add price validation warnings in SkidPricingMatrix.jsx
  - File: src/components/pricing/skid/SkidPricingMatrix.jsx (modify)
  - Highlight zone price inconsistencies
  - Show warning tooltips
  - Purpose: Validate price progression
  - _Requirements: 1.5, 2.5_

### UI Components - Zone Selector

- [ ] 23. Create zone selector component in src/components/pricing/skid/SkidZoneSelector.jsx
  - File: src/components/pricing/skid/SkidZoneSelector.jsx (new)
  - Create zone selection interface
  - Add visual zone indicators
  - Purpose: Allow zone selection for pricing
  - _Leverage: src/components/pricing/CityRegionSelector.jsx_
  - _Requirements: 2.1, 2.2_

- [ ] 24. Add zone status indicators in SkidZoneSelector.jsx
  - File: src/components/pricing/skid/SkidZoneSelector.jsx (modify)
  - Show configured vs unconfigured zones
  - Add zone pricing summary
  - Purpose: Display zone configuration status
  - _Requirements: 2.3_

### UI Components - Accessorial Config

- [ ] 25. Create accessorial config component in src/components/pricing/skid/AccessorialConfig.jsx
  - File: src/components/pricing/skid/AccessorialConfig.jsx (new)
  - Create charge type list interface
  - Add enable/disable toggles
  - Purpose: Configure additional charges
  - _Leverage: src/components/WeightRangeManager.jsx UI patterns_
  - _Requirements: 4.1_

- [ ] 26. Add charge value inputs in AccessorialConfig.jsx
  - File: src/components/pricing/skid/AccessorialConfig.jsx (modify)
  - Create fixed amount inputs
  - Add percentage value inputs
  - Purpose: Set charge amounts
  - _Requirements: 4.2_

- [ ] 27. Add charge history display in AccessorialConfig.jsx
  - File: src/components/pricing/skid/AccessorialConfig.jsx (modify)
  - Show modification history
  - Display effective dates
  - Purpose: View charge audit trail
  - _Requirements: 4.5_

### Import/Export Functionality

- [ ] 28. Create Excel template generator in src/utils/pricing/skidExcelTemplate.js
  - File: src/utils/pricing/skidExcelTemplate.js (new)
  - Generate downloadable Excel template
  - Include sample data and headers
  - Purpose: Provide import template
  - _Leverage: src/utils/truck/importExportService.js_
  - _Requirements: 3.1_

- [ ] 29. Create Excel parser for skid pricing in src/utils/pricing/skidExcelParser.js
  - File: src/utils/pricing/skidExcelParser.js (new)
  - Parse Excel/CSV files
  - Validate required columns
  - Purpose: Import price data from Excel
  - _Leverage: src/utils/truck/importExportService.js xlsx handling_
  - _Requirements: 3.1, 3.2_

- [ ] 30. Add import validation and error reporting in skidExcelParser.js
  - File: src/utils/pricing/skidExcelParser.js (modify)
  - Generate detailed error reports
  - Highlight specific row/column issues
  - Purpose: Provide clear import feedback
  - _Requirements: 3.2_

- [ ] 31. Create Excel exporter for skid pricing in src/utils/pricing/skidExcelExporter.js
  - File: src/utils/pricing/skidExcelExporter.js (new)
  - Export complete price matrix
  - Include all zones and skid counts
  - Purpose: Export pricing to Excel
  - _Leverage: src/utils/truck/importExportService.js export patterns_
  - _Requirements: 3.4_

- [ ] 32. Add conflict resolution dialog component in src/components/pricing/skid/ImportConflictDialog.jsx
  - File: src/components/pricing/skid/ImportConflictDialog.jsx (new)
  - Show conflicting data comparison
  - Provide overwrite/skip/merge options
  - Purpose: Handle import conflicts
  - _Requirements: 3.5_

### Price Calculation UI

- [ ] 33. Create price calculator component in src/components/pricing/skid/SkidPriceCalculator.jsx
  - File: src/components/pricing/skid/SkidPriceCalculator.jsx (new)
  - Create skid count input
  - Add zone selection dropdown
  - Purpose: Quick price calculation interface
  - _Leverage: src/components/cities/PriceCalculatorDemo.jsx_
  - _Requirements: 5.1, 5.2_

- [ ] 34. Add accessorial charge selection in SkidPriceCalculator.jsx
  - File: src/components/pricing/skid/SkidPriceCalculator.jsx (modify)
  - Add charge checkboxes
  - Show charge amounts
  - Purpose: Include accessorial charges
  - _Requirements: 5.4_

- [ ] 35. Add price breakdown display in SkidPriceCalculator.jsx
  - File: src/components/pricing/skid/SkidPriceCalculator.jsx (modify)
  - Show base price and charges
  - Display total with breakdown
  - Purpose: Show detailed pricing
  - _Requirements: 5.4_

- [ ] 36. Add copy quote functionality in SkidPriceCalculator.jsx
  - File: src/components/pricing/skid/SkidPriceCalculator.jsx (modify)
  - Implement clipboard copy
  - Format quote for email/chat
  - Purpose: Quick quote sharing
  - _Requirements: 5.5_

### Integration and Migration

- [ ] 37. Create migration utility in src/utils/migration/skidPricingMigration.js
  - File: src/utils/migration/skidPricingMigration.js (new)
  - Export weight-based rules
  - Transform to skid model
  - Purpose: Migrate existing pricing
  - _Leverage: src/services/pricingMigrationService.js_
  - _Requirements: 1.1_

- [ ] 38. Add migration status tracking in skidPricingMigration.js
  - File: src/utils/migration/skidPricingMigration.js (modify)
  - Track migration progress
  - Store migration metadata
  - Purpose: Monitor migration status
  - _Requirements: 1.1_

- [ ] 39. Create pricing mode toggle in src/components/pricing/PricingModeSelector.jsx
  - File: src/components/pricing/PricingModeSelector.jsx (new)
  - Add weight/skid mode switch
  - Show current mode indicator
  - Purpose: Switch between pricing modes
  - _Requirements: 1.1_

- [ ] 40. Update main pricing config page in src/pages/TruckDelivery/PricingConfig.jsx
  - File: src/pages/TruckDelivery/PricingConfig.jsx (modify)
  - Integrate SkidPricingMatrix component
  - Add mode selector integration
  - Purpose: Add skid pricing to main UI
  - _Leverage: existing PricingConfig structure_
  - _Requirements: 1.1_

### Internationalization

- [ ] 41. Create i18n translations for skid pricing in src/utils/i18n/skidPricingTranslations.js
  - File: src/utils/i18n/skidPricingTranslations.js (new)
  - Add English translations
  - Add Chinese translations
  - Purpose: Support multi-language UI
  - _Requirements: Usability - Multi-language_

- [ ] 42. Apply translations to SkidPricingMatrix component
  - File: src/components/pricing/skid/SkidPricingMatrix.jsx (modify)
  - Replace hardcoded strings with i18n keys
  - Add language prop support
  - Purpose: Enable language switching
  - _Requirements: Usability - Multi-language_

### Testing Support

- [ ] 43. Create test data generator in src/utils/testing/skidPricingTestData.js
  - File: src/utils/testing/skidPricingTestData.js (new)
  - Generate sample pricing configurations
  - Create test scenarios
  - Purpose: Support testing and demos
  - _Leverage: src/utils/testUtils.js_
  - _Requirements: All_

- [ ] 44. Add data-testid attributes to key components
  - Files: src/components/pricing/skid/SkidPricingMatrix.jsx, SkidPriceCalculator.jsx (modify)
  - Add testid to inputs and buttons
  - Label key interaction points
  - Purpose: Enable automated testing
  - _Requirements: All_

### Performance Optimization

- [ ] 45. Add virtual scrolling to SkidPricingMatrix for large datasets
  - File: src/components/pricing/skid/SkidPricingMatrix.jsx (modify)
  - Implement react-window integration
  - Render only visible rows
  - Purpose: Optimize rendering performance
  - _Requirements: Performance - < 2s load time_

- [ ] 46. Add debounced save to pricing edits
  - File: src/components/pricing/skid/SkidPricingMatrix.jsx (modify)
  - Implement 500ms save debouncing
  - Batch multiple cell changes
  - Purpose: Reduce save operations
  - _Requirements: Performance_

### Documentation and Help

- [ ] 47. Create help tooltips for pricing interface
  - File: src/components/pricing/skid/SkidPricingMatrix.jsx (modify)
  - Add info icons with tooltips
  - Explain pricing rules
  - Purpose: Improve user understanding
  - _Requirements: Usability_

- [ ] 48. Add validation feedback messages
  - Files: All skid pricing components (modify)
  - Add error message displays
  - Show success confirmations
  - Purpose: Provide clear user feedback
  - _Requirements: 1.5, 2.5, 3.2_