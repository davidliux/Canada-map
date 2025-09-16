# Requirements: Dynamic Pricing with Region/City Selection

## Overview
Replace the traditional weight-based pricing system with a unified dynamic pricing system that incorporates region and city selection. Each region will have its own dynamic pricing rules, allowing for location-specific price calculations.

## Alignment with Product Vision
This feature directly supports the product vision outlined in the "新增功能（卡车派送）" roadmap, specifically:
- **城市级别管理**: Organize delivery regions by city units, enabling structured pricing hierarchy
- **分级区域定价**: Each city contains 1-4 price regions with graduated pricing tiers
- **视觉化价格梯度**: Visual representation of price differences through color gradients
- **提升效率**: Reduces configuration time by 80% through intuitive region-based pricing
- **扩展性**: Supports multiple delivery modes with dynamic pricing at the core

## User Stories

### Story 1: Region-Based Dynamic Pricing Configuration
**As a** pricing manager  
**I want to** configure different dynamic pricing rules for each region  
**So that** I can optimize pricing based on regional market conditions

**Acceptance Criteria:**
- WHEN I access the pricing configuration page
  - THEN I can select a specific region or city first
  - AND I can configure dynamic pricing rules for that region
- WHEN I create a pricing rule
  - THEN it is automatically associated with the selected region
  - AND the regionId is properly validated and stored
- WHEN I view pricing rules
  - THEN I can filter by region/city
  - AND see which region each rule belongs to

### Story 2: City-Level Pricing Management
**As a** logistics coordinator  
**I want to** manage pricing at the city level  
**So that** I can provide consistent pricing within metropolitan areas

**Acceptance Criteria:**
- WHEN I select a city
  - THEN I see all regions within that city
  - AND I can configure pricing rules for each region
- WHEN I apply city-wide pricing changes
  - THEN all regions within the city are updated
  - AND the changes are reflected immediately in the UI
- WHEN I view city pricing
  - THEN I can see a consolidated view of all region prices

### Story 3: Removal of Traditional Pricing
**As a** system administrator  
**I want to** have only the dynamic pricing system active  
**So that** users have a single, consistent pricing interface

**Acceptance Criteria:**
- WHEN I access the pricing section
  - THEN I only see dynamic pricing options
  - AND traditional weight-range pricing is not available
- WHEN old pricing components are removed
  - THEN no broken links or references remain
  - AND the navigation is updated accordingly
- WHEN data migration is needed
  - THEN existing price configurations are preserved
  - AND converted to dynamic pricing rules where applicable

### Story 4: Visual Region Selection for Pricing
**As a** pricing analyst  
**I want to** visually select regions on a map when configuring prices  
**So that** I can easily identify and manage geographic pricing zones

**Acceptance Criteria:**
- WHEN I access dynamic pricing configuration
  - THEN I see a map with selectable regions
  - AND selected regions are highlighted
- WHEN I click on a region on the map
  - THEN the pricing configuration for that region loads
  - AND I can modify its pricing rules
- WHEN multiple regions have the same pricing
  - THEN they are visually grouped with the same color
  - AND I can manage them together

### Story 5: Batch Region Pricing Operations
**As a** pricing manager  
**I want to** apply pricing rules to multiple regions at once  
**So that** I can efficiently manage pricing across large geographic areas

**Acceptance Criteria:**
- WHEN I select multiple regions
  - THEN I can apply the same pricing rule to all
  - AND see a preview before confirming
- WHEN I copy pricing from one region
  - THEN I can paste it to multiple other regions
  - AND adjust multipliers for each if needed
- WHEN I perform batch operations
  - THEN I receive confirmation of affected regions
  - AND can undo the operation if needed

### Story 6: City-Region Binding Management
**As a** logistics administrator  
**I want to** manage the binding between cities and their regions  
**So that** pricing rules are properly organized by geographic hierarchy

**Acceptance Criteria:**
- WHEN I create or edit a city
  - THEN I can define 1-4 regions within that city
  - AND assign FSA codes to each region
- WHEN I bind a region to a city
  - THEN the region inherits the city's base configuration
  - AND can have region-specific price multipliers
- WHEN I view the city-region hierarchy
  - THEN I see a clear visual representation of the relationships
  - AND can modify bindings without data loss

## Technical Requirements

### Data Model Requirements
- Each pricing rule MUST include a `regionId` field that matches the truck-delivery module's city-region hierarchy
- The `regionId` MUST correspond to the region structure: `{cityId}-{regionLevel}` (e.g., "toronto-1" for Toronto Region 1)
- Region data structure MUST support hierarchical organization (City → Region → FSA/Postal Codes)
- Pricing rules MUST be queryable by region, city, and active status
- System MUST maintain referential integrity between regions and pricing rules
- System MUST support seamless migration from existing RegionPriceManager component data
- City-region bindings MUST be validated to prevent orphaned pricing rules

### UI/UX Requirements
- Region selector MUST be integrated into the pricing rule editor
- Map visualization MUST show pricing zones with color coding
- Batch operations MUST show progress indicators
- Form validation MUST prevent saving rules without region assignment
- City selection MUST be a prerequisite for region selection
- Visual hierarchy MUST clearly show city → region → FSA relationships

### Performance Requirements
- Region selection MUST load within 500ms
- Pricing rule queries by region MUST return within 1 second
- Map rendering with pricing zones MUST complete within 3 seconds
- Batch operations MUST process at least 10 regions per second
- City-region hierarchy loading MUST complete within 2 seconds

### Integration Requirements
- MUST integrate with existing truck delivery city/region management
- MUST preserve existing dynamic pricing calculation engine
- MUST maintain backward compatibility with API endpoints
- MUST support data export/import with region information
- MUST synchronize with cityStorage and truckDeliveryStorage modules

## Non-Functional Requirements

### Security Requirements
- Dynamic pricing rule configuration MUST require administrator role authentication
- Batch operations MUST require explicit confirmation before execution
- API endpoints MUST validate user permissions for region-specific operations
- Sensitive pricing data MUST not be exposed in client-side logs
- Region modifications MUST be audit-logged with user identification

### Reliability Requirements
- System MUST retain last valid pricing configuration during failures
- Data migration MUST support rollback to previous state
- Pricing calculations MUST remain available offline using cached rules
- System MUST handle concurrent pricing rule updates without data corruption
- City-region bindings MUST be validated before persistence

### Usability Requirements
- Region selection interface MUST be intuitive without training
- Visual feedback MUST be provided for all user actions within 200ms
- Error messages MUST be clear and actionable
- Batch operations MUST show real-time progress
- City-region hierarchy MUST be visually clear and navigable

### Maintainability Requirements
- Code MUST follow existing project structure conventions
- Components MUST be modular and reusable
- Data migration scripts MUST be idempotent
- System MUST log all pricing rule changes for audit
- Documentation MUST be updated with new data model

## Constraints

### Technical Constraints
- Must work within existing React/Vite architecture
- Must maintain localStorage-based data persistence
- Must support offline functionality for pricing calculations
- Must be compatible with existing Leaflet map implementation
- localStorage size limit of 5-10MB must be respected

### Business Constraints
- Migration must not disrupt existing pricing operations
- Historical pricing data must be preserved
- System must support gradual rollout by region
- Training materials must be updated before full deployment
- Transition period of 30 days for users to adapt

## Assumptions
- Cities and regions are already defined in the truck delivery module
- Dynamic pricing engine is fully functional and tested
- Users understand the concept of region-based pricing
- Map data for all regions is available and accurate
- Backend API can be modified to support new data model

## Dependencies
- Truck delivery module for city/region data
- Dynamic pricing engine for rule calculation
- Leaflet maps for visualization
- Backend API for data persistence
- PricingService module for API communication
- UnifiedStorage module for local data management

## Risks
- **Data Migration Risk**: Existing traditional pricing data may not map cleanly to dynamic rules
  - Mitigation: Create migration tool with manual review process
- **User Adoption Risk**: Users familiar with traditional pricing may resist change
  - Mitigation: Provide comprehensive training and transition period
- **Performance Risk**: Large number of regions may slow down the interface
  - Mitigation: Implement pagination and lazy loading for regions
- **Data Integrity Risk**: City-region bindings may become inconsistent
  - Mitigation: Implement validation and integrity checks
- **Storage Capacity Risk**: Dynamic rules may exceed localStorage limits
  - Mitigation: Implement data compression and cleanup strategies

## Success Criteria
- All pricing configuration uses dynamic pricing rules
- Each pricing rule is associated with a specific region
- Traditional pricing components are completely removed
- System performance meets or exceeds current benchmarks
- User satisfaction scores remain stable or improve
- Zero data loss during migration
- 100% of pricing rules have valid region assignments
- City-region hierarchy is fully navigable and manageable

## Out of Scope
- Modification of the core dynamic pricing calculation algorithm
- Changes to the underlying map data or FSA boundaries
- Integration with external pricing services
- Mobile application development
- Real-time pricing synchronization across multiple users
- Automatic price optimization based on market data
- Multi-currency support beyond CAD/USD
- API rate limiting implementation