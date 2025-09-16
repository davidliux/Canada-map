# Dynamic Pricing Configuration System - Task Breakdown

## Overview
This document breaks down the implementation into atomic, executable tasks. Each task is designed to be completed in 15-30 minutes and touches 1-3 related files.

## Task List

### Phase 1: Database and Data Models

- [x] 1. Create Database Schema
  - Create Prisma schema for pricing tables
  - Files: backend/prisma/schema.prisma
  - Add truck_pricing_rules, truck_price_tiers, truck_price_audit tables
  - _Requirements: 4.4.1_
  - _Leverage: backend/prisma/schema.prisma_

- [x] 2. Generate Database Migration
  - Generate and run Prisma migration for new tables
  - Files: backend/prisma/migrations/[timestamp]_add_pricing_tables/migration.sql
  - Run npx prisma migrate dev --name add_pricing_tables
  - _Requirements: 4.4.1_
  - _Leverage: existing migration patterns_

- [x] 3. Create TypeScript Types
  - Define PricingRule TypeScript interfaces
  - Files: src/types/pricing.ts (new)
  - Define PricingRuleConfig, PriceTier, VehicleConfig interfaces
  - _Requirements: 4.1_
  - _Leverage: src/types/truckDelivery.js_

- [x] 4. Create Validation Functions
  - Implement validation functions for pricing rules
  - Files: src/utils/validation/pricingValidation.js (new)
  - Validate plate ranges, price values, increment rules
  - _Requirements: 3.1, 3.2_
  - _Leverage: src/utils/dataValidation.js_

### Phase 2: Backend API

- [x] 5. Create Pricing Routes File
  - Set up Express router for pricing endpoints
  - Files: backend/src/routes/truckPricing.js (new)
  - Basic router setup with middleware
  - _Requirements: 5.1_
  - _Leverage: backend/src/routes/truckDelivery.js_

- [x] 6. Implement GET Pricing Rules Endpoint
  - Create endpoint to fetch pricing rules by region
  - Files: backend/src/routes/truckPricing.js
  - GET /api/v1/truck-delivery/pricing-rules with region filtering
  - _Requirements: 5.1_
  - _Leverage: backend/src/config/pgDatabase.js_

- [x] 7. Implement GET Single Rule Endpoint
  - Create endpoint to fetch single pricing rule
  - Files: backend/src/routes/truckPricing.js
  - GET /api/v1/truck-delivery/pricing-rules/:id
  - _Requirements: 5.1_
  - _Leverage: existing error handling patterns_

- [x] 8. Implement POST Create Rule Endpoint
  - Create endpoint to add new pricing rule
  - Files: backend/src/routes/truckPricing.js
  - POST /api/v1/truck-delivery/pricing-rules with validation
  - _Requirements: 3.1, 5.1_
  - _Leverage: transaction patterns_

- [x] 9. Implement PUT Update Rule Endpoint
  - Create endpoint to update existing pricing rule
  - Files: backend/src/routes/truckPricing.js
  - PUT /api/v1/truck-delivery/pricing-rules/:id
  - _Requirements: 3.1, 5.1_
  - _Leverage: audit logging patterns_

- [x] 10. Implement DELETE Rule Endpoint
  - Create endpoint to delete pricing rule
  - Files: backend/src/routes/truckPricing.js
  - DELETE /api/v1/truck-delivery/pricing-rules/:id
  - _Requirements: 5.1_
  - _Leverage: soft delete patterns_

- [x] 11. Implement Calculate Price Endpoint
  - Create endpoint for price calculation
  - Files: backend/src/routes/truckPricing.js
  - POST /api/v1/truck-delivery/calculate-price
  - _Requirements: 3.4, 5.1_
  - _Leverage: calculation engine from Phase 3_

- [x] 12. Mount Pricing Routes
  - Register pricing routes in main server file
  - Files: backend/src/server.js
  - Add app.use('/api/v1/truck-delivery', truckPricingRoutes)
  - _Requirements: 5.1_
  - _Leverage: existing route mounting_

### Phase 3: Calculation Engine

- [x] 13. Create Price Calculation Engine
  - Implement core price calculation logic
  - Files: src/utils/pricing/priceCalculationEngine.js (new)
  - Calculate base price, increments, multi-vehicle splits
  - _Requirements: 3.4, 4.3.1_
  - _Leverage: existing calculator patterns_

- [x] 14. Implement Base Price Calculator
  - Create function to calculate base plate range pricing
  - Files: src/utils/pricing/priceCalculationEngine.js
  - calculateBasePrice(plateCount, baseConfig)
  - _Requirements: 3.1_
  - _Leverage: pure function patterns_

- [x] 15. Implement Increment Calculator
  - Create function for incremental pricing logic
  - Files: src/utils/pricing/priceCalculationEngine.js
  - calculateIncrements(plateCount, incrementConfig)
  - _Requirements: 3.2_
  - _Leverage: support fixed, percentage, tiered_

- [x] 16. Implement Vehicle Split Calculator
  - Create function to split plates across vehicles
  - Files: src/utils/pricing/priceCalculationEngine.js
  - calculateMultiVehicle(plateCount, vehicleConfig, baseCalculator)
  - _Requirements: 3.3_
  - _Leverage: handle overflow and caps_

- [x] 17. Create Price Breakdown Generator
  - Generate detailed price breakdown
  - Files: src/utils/pricing/priceCalculationEngine.js
  - generateBreakdown(plateCount, rule)
  - _Requirements: 3.4_
  - _Leverage: structured breakdown object_

### Phase 4: Service Layer

- [x] 18. Create Pricing Service
  - Implement main pricing service class
  - Files: src/services/pricingService.js (new)
  - CRUD operations for pricing rules
  - _Requirements: 4.2.1_
  - _Leverage: src/utils/storage/cityDatabaseService.js_

- [x] 19. Implement Rule Fetching
  - Add methods to fetch pricing rules
  - Files: src/services/pricingService.js
  - getRulesByRegion(), getRule()
  - _Requirements: 4.2.1_
  - _Leverage: src/utils/apiClient.js_

- [x] 20. Implement Rule Creation
  - Add method to create pricing rules
  - Files: src/services/pricingService.js
  - createRule(ruleData) with validation
  - _Requirements: 3.1, 4.2.1_
  - _Leverage: validation before API call_

- [x] 21. Implement Rule Updates
  - Add method to update pricing rules
  - Files: src/services/pricingService.js
  - updateRule(ruleId, updates)
  - _Requirements: 3.1, 4.2.1_
  - _Leverage: optimistic updates with rollback_

- [x] 22. Create Storage Service
  - Implement storage service for import/export
  - Files: src/utils/pricing/pricingStorageService.js (new)
  - Import/export JSON, validation
  - _Requirements: 3.6, 4.2.3_
  - _Leverage: src/utils/truck/importExportService.js_

- [x] 23. Implement Caching Layer
  - Add caching for frequently accessed rules
  - Files: src/services/pricingService.js
  - Cache with TTL, invalidation on updates
  - _Requirements: 5.3.2_
  - _Leverage: Map for in-memory cache_

### Phase 5: UI Components - Configuration

- [x] 24. Create Pricing Page Component
  - Create main pricing management page
  - Files: src/pages/TruckDelivery/PricingConfig.jsx (new)
  - Page layout with region selector
  - _Requirements: 3.1_
  - _Leverage: src/pages/TruckDelivery/PricingPage.jsx_

- [x] 25. Create Pricing Rule Manager
  - Implement main container component
  - Files: src/components/pricing/PricingRuleManager.jsx (new)
  - List view, create/edit/delete actions
  - _Requirements: 4.2.1_
  - _Leverage: Framer Motion animations_

- [x] 26. Create Pricing Rule List
  - Implement list component for rules
  - Files: src/components/pricing/PricingRuleList.jsx (new)
  - Display rules with status indicators
  - _Requirements: 3.1_
  - _Leverage: src/components/cities/CityManager.jsx_

- [x] 27. Create Pricing Rule Editor
  - Implement form component for rule editing
  - Files: src/components/pricing/PricingRuleEditor.jsx (new)
  - Tabbed interface for configuration sections
  - _Requirements: 3.1, 3.2, 3.3_
  - _Leverage: src/components/cities/CityRegionEditor.jsx_

- [x] 28. Create Base Price Config Component
  - Implement base pricing configuration UI
  - Files: src/components/pricing/BasePriceConfig.jsx (new)
  - Plate range selector, price input
  - _Requirements: 3.1_
  - _Leverage: existing input components_

- [x] 29. Create Increment Config Component
  - Implement increment rules configuration UI
  - Files: src/components/pricing/IncrementConfig.jsx (new)
  - Type selector, value inputs, tier management
  - _Requirements: 3.2_
  - _Leverage: dropdown and input patterns_

- [x] 30. Create Vehicle Config Component
  - Implement vehicle constraints configuration UI
  - Files: src/components/pricing/VehicleConfig.jsx (new)
  - Max plates, price cap, overflow handling
  - _Requirements: 3.3_
  - _Leverage: number inputs with validation_

### Phase 6: UI Components - Preview and Calculation

- [x] 31. Create Price Preview Table
  - Implement preview table component
  - Files: src/components/pricing/PricePreviewTable.jsx (new)
  - Show prices for plates 1-20, highlight anomalies
  - _Requirements: 3.5_
  - _Leverage: table styles from existing components_

- [x] 32. Create Pricing Calculator Component
  - Implement interactive calculator UI
  - Files: src/components/pricing/PricingCalculator.jsx (new)
  - Plate input, real-time calculation, breakdown
  - _Requirements: 3.4_
  - _Leverage: card layout patterns_

- [x] 33. Create Price Breakdown Component
  - Implement detailed breakdown display
  - Files: src/components/pricing/PriceBreakdown.jsx (new)
  - Show multi-vehicle split, increments
  - _Requirements: 3.4_
  - _Leverage: accordion pattern for details_

- [x] 34. Create Import/Export Dialog
  - Implement import/export functionality UI
  - Files: src/components/pricing/ImportExportDialog.jsx (new)
  - File upload, validation feedback, export button
  - _Requirements: 3.6_
  - _Leverage: src/components/cities/CityEditDialog.jsx_

### Phase 7: Integration and Router

- [x] 35. Add Pricing Route
  - Add pricing configuration route to router
  - Files: src/router/index.jsx
  - Add /truck-delivery/pricing-config route
  - _Requirements: UI navigation_
  - _Leverage: existing route patterns_

- [x] 36. Add Navigation Menu Item
  - Add pricing menu item to navigation
  - Files: src/layouts/TruckDeliveryLayout.jsx
  - Add "Pricing Configuration" menu item
  - _Requirements: UI navigation_
  - _Leverage: existing menu structure_

- [x] 37. Integrate with Region Management
  - Connect pricing to region selection
  - Files: src/components/pricing/PricingRuleManager.jsx, src/services/pricingService.js
  - Load regions, filter by selection
  - _Requirements: 5.5_
  - _Leverage: cityDatabaseService_

### Phase 8: Testing

- [ ] 38. Unit Tests for Calculation Engine
  - Write tests for price calculations
  - Files: src/utils/pricing/__tests__/priceCalculationEngine.test.js (new)
  - Test all calculation scenarios
  - _Requirements: 8.1_
  - _Leverage: Jest testing framework_

- [ ] 39. Unit Tests for Validation
  - Write tests for validation functions
  - Files: src/utils/validation/__tests__/pricingValidation.test.js (new)
  - Test validation rules and edge cases
  - _Requirements: 8.1_
  - _Leverage: existing test patterns_

- [ ] 40. API Integration Tests
  - Write tests for API endpoints
  - Files: backend/src/routes/__tests__/truckPricing.test.js (new)
  - Test CRUD operations
  - _Requirements: 8.2_
  - _Leverage: Supertest for API testing_

- [ ] 41. Service Layer Tests
  - Write tests for pricing service
  - Files: src/services/__tests__/pricingService.test.js (new)
  - Test service methods
  - _Requirements: 8.1_
  - _Leverage: mock API calls_

### Phase 9: Data Migration

- [ ] 42. Create Migration Script
  - Write script to migrate existing price data
  - Files: scripts/migratePricingData.js (new)
  - Convert weight-based to plate-based pricing
  - _Requirements: 7.1_
  - _Leverage: database connection from existing scripts_

- [ ] 43. Create Rollback Script
  - Write script to rollback migration
  - Files: scripts/rollbackPricingData.js (new)
  - Restore original pricing structure
  - _Requirements: 7.1_
  - _Leverage: backup patterns_