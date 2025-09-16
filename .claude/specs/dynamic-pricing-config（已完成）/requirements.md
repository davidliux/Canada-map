# Dynamic Pricing Configuration System Requirements

## 1. Introduction

This document outlines the requirements for a flexible pricing configuration system that supports dynamic pricing based on "plates" (板) rather than fixed weight ranges. The system will enable administrators to configure complex pricing rules with base prices, incremental pricing, and vehicle capacity limits.

## 2. Business Context

### 2.1 Current Situation
- Current system uses fixed weight ranges (0-11kg, 11-15kg, etc.)
- Cannot accommodate flexible plate-based pricing models
- Lacks support for dynamic pricing rules and vehicle capacity management

### 2.2 Business Need
- Support plate-based pricing (e.g., plates 1-2 at $150, plate 3+ adds $20 each)
- Handle vehicle capacity limits (max 8 plates per vehicle)
- Calculate overflow into additional vehicles automatically
- Provide configurable pricing caps per vehicle

## 3. User Stories

### 3.1 Configure Base Pricing Rules
**As a** pricing administrator  
**I want to** set base prices for initial plate ranges  
**So that** I can implement tiered pricing strategies

**Acceptance Criteria:**
- WHEN I access the pricing configuration page
- THEN I see all regions with their current pricing rules
- WHEN I select a region for configuration
- THEN I can specify a base price (e.g., $150) for a plate range (e.g., plates 1-2)
- WHEN I save the configuration
- THEN the system validates and stores the pricing rule
- IF the plate ranges overlap with existing rules
- THEN the system displays a validation error

### 3.2 Configure Incremental Pricing
**As a** pricing administrator  
**I want to** set incremental pricing for additional plates  
**So that** prices increase progressively with volume

**Acceptance Criteria:**
- WHEN I configure a region's pricing
- THEN I can specify when incremental pricing starts (e.g., from plate 3)
- WHEN I set an increment value (e.g., $20 per plate)
- THEN the system calculates prices correctly (plate 3 = $170, plate 4 = $190, etc.)
- WHEN I choose percentage-based increments
- THEN the system calculates based on the base price percentage
- IF incremental rules conflict
- THEN the system prevents saving and shows clear error messages

### 3.3 Manage Vehicle Capacity
**As a** pricing administrator  
**I want to** set vehicle capacity limits  
**So that** pricing accounts for multi-vehicle shipments

**Acceptance Criteria:**
- WHEN I set maximum plates per vehicle to 8
- THEN the system enforces this limit in all calculations
- WHEN an order exceeds 8 plates (e.g., 10 plates)
- THEN the system calculates as: first vehicle (8 plates) + second vehicle (2 plates starting from base price)
- WHEN I set a per-vehicle price cap (e.g., $1000)
- THEN no single vehicle charge exceeds this amount
- IF vehicle capacity is changed
- THEN existing quotes are not affected (grandfathering)

### 3.4 Calculate Real-time Pricing
**As a** customer service representative  
**I want to** get instant price quotes based on plate count  
**So that** I can provide accurate pricing to customers

**Acceptance Criteria:**
- WHEN I enter 3 plates for Region 1
- AND Region 1 has: plates 1-2 at $150, +$20 per plate from plate 3
- THEN the system shows: $170 (base $150 + increment $20)
- WHEN I enter 10 plates
- AND vehicle capacity is 8 plates
- THEN the system shows breakdown: Vehicle 1 (8 plates) = $X, Vehicle 2 (2 plates) = $150
- WHEN pricing rules change
- THEN calculations update in real-time without page refresh

### 3.5 Preview Pricing Tables
**As a** pricing administrator  
**I want to** preview pricing for different plate counts  
**So that** I can verify configuration correctness

**Acceptance Criteria:**
- WHEN I complete pricing configuration
- THEN I see a preview table showing prices for 1-20 plates
- WHEN I modify any pricing parameter
- THEN the preview updates immediately
- WHEN there are price anomalies (e.g., price decreases with more plates)
- THEN the system highlights these rows with warnings
- WHEN I hover over a price
- THEN I see the calculation breakdown

### 3.6 Import/Export Configurations
**As a** pricing administrator  
**I want to** import and export pricing configurations  
**So that** I can backup and replicate pricing across regions

**Acceptance Criteria:**
- WHEN I click export for a region
- THEN the system downloads a JSON file with all pricing rules
- WHEN I import a configuration file
- THEN the system validates the format and data
- IF import data is invalid
- THEN the system shows specific validation errors
- WHEN I select "Apply to Multiple Regions"
- THEN I can choose target regions for bulk application

## 4. Functional Requirements

### 4.1 Pricing Rule Components

#### 4.1.1 Base Pricing Configuration
- **Base Plate Range**: Configurable range (e.g., 1-2, 1-3, or just 1 plate)
- **Base Price**: Fixed price for the base range in CAD or USD
- **Currency**: Support for CAD and USD with conversion rates

#### 4.1.2 Incremental Pricing Rules
- **Start Plate**: Which plate number triggers incremental pricing
- **Increment Type**:
  - Fixed: Add fixed amount per plate
  - Percentage: Add percentage of base price
  - Tiered: Different increments for different plate ranges
- **Increment Value**: The amount or percentage to add

#### 4.1.3 Vehicle Constraints
- **Max Plates per Vehicle**: Configurable limit (default: 8)
- **Price Cap per Vehicle**: Optional maximum price per vehicle
- **Overflow Handling**: Automatic calculation for multi-vehicle shipments

### 4.2 Configuration Interface

#### 4.2.1 UI Components
- Region selector with search functionality
- Tabbed interface for different configuration aspects
- Real-time validation with inline error messages
- Visual price curve graph
- Drag-and-drop for plate range adjustment

#### 4.2.2 Configuration Features
- Template library for common pricing models
- Copy configuration between regions
- Bulk edit for multiple regions
- Configuration comparison tool
- Undo/Redo functionality

### 4.3 Calculation Engine

#### 4.3.1 Core Calculations
- Single vehicle price calculation
- Multi-vehicle split calculation
- Price cap application
- Currency conversion

#### 4.3.2 Performance Requirements
- Single calculation response time < 10ms
- Batch calculation (100 items) < 100ms
- Real-time preview updates < 50ms

### 4.4 Data Management

#### 4.4.1 Storage Requirements
- Store configurations in PostgreSQL database
- Maintain configuration version history
- Support configuration rollback
- Archive deleted configurations for 90 days

#### 4.4.2 Audit Trail
- Log all configuration changes
- Track user, timestamp, and changes made
- Provide change comparison views
- Export audit logs for compliance

## 5. Non-Functional Requirements

### 5.1 Performance
- Page load time < 1 second
- Configuration save time < 500ms
- Support 1000+ concurrent users
- Handle 100+ regions without degradation

### 5.2 Usability
- Mobile-responsive design
- Keyboard navigation support
- Contextual help and tooltips
- Configuration wizard for new users
- Clear error messages with resolution guidance

### 5.3 Security
- Role-based access control
- Configuration change requires authentication
- Encrypt sensitive pricing data
- API rate limiting to prevent abuse

### 5.4 Reliability
- 99.9% uptime for pricing calculations
- Graceful degradation if database is unavailable
- Automatic backup every 6 hours
- Disaster recovery within 1 hour

### 5.5 Compatibility
- Integration with existing region management
- Backward compatibility with current price tables
- API compatibility for external systems
- Data migration from legacy system

## 6. Technical Constraints

### 6.1 Technology Stack
- React 18+ with TypeScript
- Tailwind CSS for styling
- Framer Motion for animations
- PostgreSQL for data storage
- Node.js/Express backend

### 6.2 Integration Requirements
- Use existing authentication system
- Integrate with current region/city management
- Maintain API compatibility
- Support existing UI component library

### 6.3 Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 7. Acceptance Criteria

### 7.1 Functional Acceptance
- [ ] All user stories implemented and tested
- [ ] Pricing calculations accurate to 2 decimal places
- [ ] Multi-vehicle calculations work correctly
- [ ] Import/Export functionality operational
- [ ] Configuration templates available

### 7.2 Performance Acceptance
- [ ] All performance metrics met
- [ ] Load testing passed with 1000 concurrent users
- [ ] No memory leaks in 24-hour stress test

### 7.3 Quality Acceptance
- [ ] Code coverage > 80%
- [ ] No critical or high-severity bugs
- [ ] Accessibility WCAG 2.1 AA compliant
- [ ] Security audit passed

## 8. Assumptions and Dependencies

### 8.1 Assumptions
- Users have modern browsers
- Stable internet connection available
- Database infrastructure can handle increased load
- Users trained on new pricing model

### 8.2 Dependencies
- Database migration completed before deployment
- Authentication service available
- Region management system updated
- API documentation updated

## 9. Risks and Mitigation

### 9.1 Technical Risks
- **Risk**: Complex calculations may have edge cases
- **Mitigation**: Comprehensive test suite with edge cases
- **Risk**: Performance degradation with many rules
- **Mitigation**: Implement caching and optimization

### 9.2 Business Risks
- **Risk**: User resistance to new pricing model
- **Mitigation**: Provide training and transition period
- **Risk**: Pricing errors affecting revenue
- **Mitigation**: Parallel run with manual verification

### 9.3 Data Migration Risks
- **Risk**: Data loss during migration
- **Mitigation**: Complete backup and rollback plan
- **Risk**: Inconsistent pricing after migration
- **Mitigation**: Automated validation and reconciliation

## 10. Success Metrics

### 10.1 Business Metrics
- Pricing configuration time reduced by 50%
- Pricing errors reduced by 90%
- Customer satisfaction score > 4.5/5

### 10.2 Technical Metrics
- System availability > 99.9%
- Average response time < 100ms
- Zero data loss incidents

### 10.3 User Adoption Metrics
- 80% of administrators using new system within 2 weeks
- Support tickets reduced by 40%
- Feature utilization rate > 70%