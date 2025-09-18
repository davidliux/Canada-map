# Tasks: Dynamic Pricing with Region/City Selection

## Task Overview
Break down the implementation of region-based dynamic pricing into atomic, executable tasks. Each task is designed to be completed in 15-30 minutes by focusing on specific file operations.

## Success Criteria
- Each pricing rule has a valid regionId
- Traditional pricing components completely removed
- City-region hierarchy fully functional
- Migration completed without data loss
- All tests passing

## Implementation Tasks

### Data Model Setup

- [x] **Task 1**: Add pricing storage keys to types
  - Files: `src/types/truckDelivery.js`
  - Action: Add `PRICING_RULES_V2: 'pricing_rules_v2'` to TRUCK_STORAGE_KEYS
  - Requirement: Story 1 - Region-based pricing storage
  - Leverage: Existing TRUCK_STORAGE_KEYS object

- [x] **Task 2**: Add region rules index key
  - Files: `src/types/truckDelivery.js`
  - Action: Add `REGION_RULES_INDEX: 'pricing_region_index'` to TRUCK_STORAGE_KEYS
  - Requirement: Story 1 - Region indexing for queries
  - Leverage: Existing TRUCK_STORAGE_KEYS pattern

- [x] **Task 3**: Add migration backup key
  - Files: `src/types/truckDelivery.js`
  - Action: Add `MIGRATION_BACKUP: 'pricing_migration_backup'` to TRUCK_STORAGE_KEYS
  - Requirement: Story 3 - Data migration backup
  - Leverage: Existing storage key patterns

### Validation Enhancement

- [ ] **Task 4**: Add regionId validation check
  - Files: `src/utils/pricing/pricingValidator.js`
  - Action: Add regionId check at line 14 in validatePricingRule
  - Requirement: Story 1 - RegionId validation
  - Leverage: Existing error array pattern

- [ ] **Task 5**: Add city-region binding validator
  - Files: `src/utils/pricing/regionValidator.js` (create)
  - Action: Create validateRegionBinding function
  - Requirement: Story 6 - City-region binding validation
  - Leverage: Validation pattern from pricingValidator.js

### Storage Service

- [x] **Task 6**: Create enhanced pricing storage class
  - Files: `src/utils/storage/pricingStorageV2.js` (create)
  - Action: Create class with constructor and savePricingRule method
  - Requirement: Story 1 - Region-aware storage
  - Leverage: Import unifiedStorage and dataUpdateNotifier

- [x] **Task 7**: Add getRulesByRegion to storage
  - Files: `src/utils/storage/pricingStorageV2.js`
  - Action: Add getRulesByRegion method to class
  - Requirement: Story 1 - Query rules by region
  - Leverage: LocalStorage patterns from unifiedStorage

- [x] **Task 8**: Add storage capacity check
  - Files: `src/utils/storage/pricingStorageV2.js`
  - Action: Add calculateStorageUsage method
  - Requirement: Technical - localStorage limits
  - Leverage: Blob size calculation pattern

### Service Layer - City Methods

- [ ] **Task 9**: Add getRulesByCity to PricingService
  - Files: `src/services/pricingService.js`
  - Action: Add method after line 72 (getRulesByRegion)
  - Requirement: Story 2 - City-level pricing
  - Leverage: Existing getRulesByRegion method

- [ ] **Task 10**: Add getCityRegions helper
  - Files: `src/services/pricingService.js`
  - Action: Add private helper method for city regions
  - Requirement: Story 2 - City region lookup
  - Leverage: CityStorageService from cityStorage.js

- [ ] **Task 11**: Add batchUpdateCityRules method
  - Files: `src/services/pricingService.js`
  - Action: Add method for batch city updates
  - Requirement: Story 2 - City-wide pricing changes
  - Leverage: Existing apiClient.post pattern

### Service Layer - Batch Operations

- [ ] **Task 12**: Add copyRulesToRegions method
  - Files: `src/services/pricingService.js`
  - Action: Add method after batchUpdateCityRules
  - Requirement: Story 5 - Copy pricing between regions
  - Leverage: Existing createRule method

- [ ] **Task 13**: Add applyMultipliers helper
  - Files: `src/services/pricingService.js`
  - Action: Add helper for price multiplier calculations
  - Requirement: Story 5 - Adjust multipliers
  - Leverage: Existing price calculation patterns

### Migration Service

- [x] **Task 14**: Create migration service file
  - Files: `src/services/pricingMigrationService.js` (create)
  - Action: Create class with constructor
  - Requirement: Story 3 - Migration infrastructure
  - Leverage: Service class patterns

- [ ] **Task 15**: Add analyzeTraditionalPricing method
  - Files: `src/services/pricingMigrationService.js`
  - Action: Add method to analyze existing data
  - Requirement: Story 3 - Analyze traditional pricing
  - Leverage: getAllRegionConfigs from unifiedStorage

- [ ] **Task 16**: Add convertToDynamicRule method
  - Files: `src/services/pricingMigrationService.js`
  - Action: Add single rule conversion logic
  - Requirement: Story 3 - Convert pricing format
  - Leverage: PricingRule structure from validator

- [ ] **Task 17**: Add batchConvert method
  - Files: `src/services/pricingMigrationService.js`
  - Action: Add method to convert multiple rules
  - Requirement: Story 3 - Batch conversion
  - Leverage: convertToDynamicRule method

### Component - City Region Selector

- [ ] **Task 18**: Create CityRegionSelector component
  - Files: `src/components/pricing/CityRegionSelector.jsx` (create)
  - Action: Create functional component with state hooks
  - Requirement: Story 6 - City-region selection UI
  - Leverage: React hooks pattern

- [ ] **Task 19**: Add city dropdown to selector
  - Files: `src/components/pricing/CityRegionSelector.jsx`
  - Action: Add select element for cities
  - Requirement: Story 2 - City selection
  - Leverage: CityStorageService.getAllCities()

- [ ] **Task 20**: Add region list to selector
  - Files: `src/components/pricing/CityRegionSelector.jsx`
  - Action: Add region display based on selected city
  - Requirement: Story 6 - Region selection
  - Leverage: City regions data structure

- [ ] **Task 21**: Add selection change handler
  - Files: `src/components/pricing/CityRegionSelector.jsx`
  - Action: Add onSelectionChange prop callback
  - Requirement: Story 1 - Selection events
  - Leverage: Callback pattern from existing components

### Component - Region Map View

- [ ] **Task 22**: Create RegionMapView component
  - Files: `src/components/pricing/RegionMapView.jsx` (create)
  - Action: Create component with Leaflet map
  - Requirement: Story 4 - Visual region selection
  - Leverage: Import AccurateFSAMap component

- [ ] **Task 23**: Add pricing zone layer
  - Files: `src/components/pricing/RegionMapView.jsx`
  - Action: Add GeoJSON layer for pricing zones
  - Requirement: Story 4 - Pricing zone visualization
  - Leverage: Leaflet GeoJSON patterns

- [ ] **Task 24**: Add color coding by price
  - Files: `src/components/pricing/RegionMapView.jsx`
  - Action: Add getColor function for price levels
  - Requirement: Story 4 - Color-coded pricing
  - Leverage: Color gradient patterns

- [ ] **Task 25**: Add region click handler
  - Files: `src/components/pricing/RegionMapView.jsx`
  - Action: Add onClick event for region selection
  - Requirement: Story 4 - Click to select region
  - Leverage: Leaflet event handlers

### Component - Enhanced Rule Editor

- [ ] **Task 26**: Create EnhancedPricingRuleEditor
  - Files: `src/components/pricing/EnhancedPricingRuleEditor.jsx` (create)
  - Action: Copy PricingRuleEditor as base
  - Requirement: Story 1 - Enhanced editor
  - Leverage: Existing PricingRuleEditor.jsx

- [ ] **Task 27**: Add region context to editor
  - Files: `src/components/pricing/EnhancedPricingRuleEditor.jsx`
  - Action: Add useContext for PricingContext
  - Requirement: Story 1 - Auto-populate regionId
  - Leverage: React Context API

- [ ] **Task 28**: Modify validation to include regionId
  - Files: `src/components/pricing/EnhancedPricingRuleEditor.jsx`
  - Action: Update handleValidate to include regionId
  - Requirement: Story 1 - RegionId validation
  - Leverage: validatePricingRule from validator

- [ ] **Task 29**: Add region display in form
  - Files: `src/components/pricing/EnhancedPricingRuleEditor.jsx`
  - Action: Add readonly field showing selected region
  - Requirement: Story 1 - Show region association
  - Leverage: Form field patterns

### Component - Rule List

- [ ] **Task 30**: Create PricingRuleList component
  - Files: `src/components/pricing/PricingRuleList.jsx` (create)
  - Action: Create component with props interface
  - Requirement: Story 1 - List pricing rules
  - Leverage: List patterns from PricingRuleManager

- [ ] **Task 31**: Add rule filtering by region
  - Files: `src/components/pricing/PricingRuleList.jsx`
  - Action: Add filter logic for regionId
  - Requirement: Story 1 - Filter by region
  - Leverage: Array filter patterns

- [ ] **Task 32**: Add rule item display
  - Files: `src/components/pricing/PricingRuleList.jsx`
  - Action: Add RuleItem subcomponent
  - Requirement: Story 1 - Display rule details
  - Leverage: Card component patterns

### Component - Batch Operations

- [ ] **Task 33**: Create BatchOperationsDialog
  - Files: `src/components/pricing/BatchOperationsDialog.jsx` (create)
  - Action: Create dialog component structure
  - Requirement: Story 5 - Batch operations UI
  - Leverage: Dialog patterns from ImportExportDialog

- [ ] **Task 34**: Add region multi-select
  - Files: `src/components/pricing/BatchOperationsDialog.jsx`
  - Action: Add checkbox list for regions
  - Requirement: Story 5 - Select multiple regions
  - Leverage: Checkbox patterns

- [ ] **Task 35**: Add operation preview
  - Files: `src/components/pricing/BatchOperationsDialog.jsx`
  - Action: Add preview section showing affected regions
  - Requirement: Story 5 - Preview before confirming
  - Leverage: Preview UI patterns

### Page Components

- [ ] **Task 36**: Create pricing dashboard page
  - Files: `src/pages/Management/Pricing/RegionPricingDashboard.jsx` (create)
  - Action: Create page component with layout
  - Requirement: Story 1 - Main pricing interface
  - Leverage: Dashboard layout patterns

- [ ] **Task 37**: Add component integration to dashboard
  - Files: `src/pages/Management/Pricing/RegionPricingDashboard.jsx`
  - Action: Import and arrange child components
  - Requirement: Story 1 - Integrated UI
  - Leverage: Grid layout patterns

- [ ] **Task 38**: Create PricingContext provider
  - Files: `src/contexts/PricingContext.jsx` (create)
  - Action: Create context with initial state
  - Requirement: Technical - State management
  - Leverage: React createContext

- [ ] **Task 39**: Add context actions
  - Files: `src/contexts/PricingContext.jsx`
  - Action: Add selectCity, selectRegion methods
  - Requirement: Technical - State updates
  - Leverage: useState and useReducer patterns

### Migration Tool

- [ ] **Task 40**: Create migration tool page
  - Files: `src/pages/Management/Pricing/MigrationTool.jsx` (create)
  - Action: Create page with analysis button
  - Requirement: Story 3 - Migration UI
  - Leverage: Page component patterns

- [ ] **Task 41**: Add migration progress display
  - Files: `src/pages/Management/Pricing/MigrationTool.jsx`
  - Action: Add progress bar and status
  - Requirement: Story 3 - Migration feedback
  - Leverage: Progress component patterns

- [ ] **Task 42**: Add conflict resolution UI
  - Files: `src/pages/Management/Pricing/MigrationTool.jsx`
  - Action: Add dialog for handling conflicts
  - Requirement: Story 3 - Manual conflict resolution
  - Leverage: Dialog patterns

### Router Updates

- [ ] **Task 43**: Remove traditional pricing route
  - Files: `src/router/index.jsx`
  - Action: Remove route for /management/fsa/prices (line 75-77)
  - Requirement: Story 3 - Remove traditional pricing
  - Leverage: None - removal task

- [ ] **Task 44**: Add dynamic pricing routes
  - Files: `src/router/index.jsx`
  - Action: Add /management/pricing routes
  - Requirement: Story 3 - New pricing routes
  - Leverage: Existing route patterns

- [ ] **Task 45**: Update navigation in TruckManagementLayout
  - Files: `src/layouts/TruckManagementLayout.jsx`
  - Action: Update pricing menu items
  - Requirement: Story 3 - Updated navigation
  - Leverage: NavLink component

### Component Removal

- [ ] **Task 46**: Remove RegionPriceManager imports
  - Files: `src/pages/Settings/PriceSettings.jsx`
  - Action: Remove import statement (line 11)
  - Requirement: Story 3 - Remove traditional component
  - Leverage: None - removal task

- [ ] **Task 47**: Delete RegionPriceManager file
  - Files: `src/components/RegionPriceManager.jsx`
  - Action: Delete entire file
  - Requirement: Story 3 - Remove traditional pricing
  - Leverage: None - removal task

- [ ] **Task 48**: Delete WeightRangeManager file
  - Files: `src/components/WeightRangeManager.jsx`
  - Action: Delete entire file
  - Requirement: Story 3 - Remove weight-based pricing
  - Leverage: None - removal task

- [ ] **Task 49**: Delete old PriceSettings page
  - Files: `src/pages/Settings/PriceSettings.jsx`
  - Action: Delete entire file
  - Requirement: Story 3 - Remove old interface
  - Leverage: None - removal task

### API Integration

- [ ] **Task 50**: Add getRulesByCity endpoint
  - Files: `backend/src/routes/truckDelivery.js`
  - Action: Add GET /pricing-rules route with cityId param
  - Requirement: Story 2 - City pricing API
  - Leverage: Express router patterns

- [ ] **Task 51**: Add batch update endpoint
  - Files: `backend/src/routes/truckDelivery.js`
  - Action: Add POST /pricing-rules/batch-update route
  - Requirement: Story 5 - Batch operations API
  - Leverage: Existing POST patterns

- [ ] **Task 52**: Add migration endpoint
  - Files: `backend/src/routes/truckDelivery.js`
  - Action: Add POST /pricing/migrate-traditional route
  - Requirement: Story 3 - Migration API
  - Leverage: Express async handlers

### Error Handling

- [ ] **Task 53**: Create error boundary component
  - Files: `src/components/pricing/PricingErrorBoundary.jsx` (create)
  - Action: Create class component with error state
  - Requirement: Non-functional - Error handling
  - Leverage: React Component.getDerivedStateFromError

- [ ] **Task 54**: Add error fallback UI
  - Files: `src/components/pricing/PricingErrorBoundary.jsx`
  - Action: Add render method with fallback
  - Requirement: Non-functional - User feedback
  - Leverage: Error UI patterns

- [ ] **Task 55**: Create capacity manager utility
  - Files: `src/utils/storage/capacityManager.js` (create)
  - Action: Create checkCapacity function
  - Requirement: Technical - Storage limits
  - Leverage: Blob size calculation

### Testing

- [ ] **Task 56**: Create PricingService test file
  - Files: `src/services/__tests__/pricingService.test.js` (create)
  - Action: Create test suite structure
  - Requirement: Testing - Service tests
  - Leverage: Jest test patterns

- [ ] **Task 57**: Add getRulesByCity test
  - Files: `src/services/__tests__/pricingService.test.js`
  - Action: Add test for city method
  - Requirement: Testing - City functionality
  - Leverage: Async test patterns

- [ ] **Task 58**: Create editor component test
  - Files: `src/components/pricing/__tests__/EnhancedPricingRuleEditor.test.jsx` (create)
  - Action: Add regionId validation test
  - Requirement: Testing - Component validation
  - Leverage: React Testing Library

### Performance

- [ ] **Task 59**: Create pricing cache utility
  - Files: `src/utils/pricing/pricingCache.js` (create)
  - Action: Create PricingCache class
  - Requirement: Performance - Caching
  - Leverage: Map data structure

- [ ] **Task 60**: Add cache invalidation
  - Files: `src/utils/pricing/pricingCache.js`
  - Action: Add invalidate method
  - Requirement: Performance - Cache management
  - Leverage: Cache key patterns

### Documentation

- [ ] **Task 61**: Update CLAUDE.md
  - Files: `CLAUDE.md`
  - Action: Replace traditional pricing with dynamic pricing info
  - Requirement: Maintainability - Documentation
  - Leverage: Existing doc structure

- [ ] **Task 62**: Create migration guide
  - Files: `docs/PRICING_MIGRATION.md` (create)
  - Action: Document migration steps
  - Requirement: Story 3 - Migration documentation
  - Leverage: Markdown format