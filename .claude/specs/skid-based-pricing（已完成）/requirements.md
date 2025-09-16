# Requirements Document - Skid-Based Dynamic Pricing System

## Introduction

The current dynamic pricing system relies on weight ranges for price calculation, which does not align with industry standards. Based on the provided rate card, the logistics industry standard is to price based on skids (pallets) with different price zones for different delivery regions. This feature will restructure the existing pricing system to implement a skid-based tiered pricing model that matches real-world business practices.

## Alignment with Product Vision

This feature directly supports the product vision goals outlined in product.md:

1. **Efficiency Enhancement**: Accurate skid-based pricing reduces manual calculation errors by 80%
2. **Cost Reduction**: Proper pricing strategies help optimize operational costs by 15%
3. **User Experience**: Industry-standard pricing interface reduces training requirements
4. **Scalability**: Provides flexible pricing configuration for truck delivery module (Phase 2)

The feature aligns with Phase 2 objectives for truck delivery module enhancement, specifically supporting city-level management and tiered regional pricing.

## Requirements

### Requirement 1: Skid-Based Pricing Model

**User Story:** As a logistics operations manager, I want to configure prices based on skids rather than weight, so that our pricing aligns with industry standards

#### Acceptance Criteria

1. WHEN the user opens pricing configuration THEN the system SHALL display a skid-based price configuration interface
2. WHEN entering skid ranges THEN the system SHALL support configurations from 1 skid to 16+ skids
3. IF the user configures a price for a specific skid count THEN the system SHALL save and apply that price for quotes
4. WHEN skid count exceeds 16 THEN the system SHALL apply the "16+" pricing rule
5. IF there are gaps in skid range configuration THEN the system SHALL display a validation warning

### Requirement 2: Multi-Zone Price Matrix

**User Story:** As a pricing strategist, I want to set different prices for different delivery zones, so that pricing reflects actual delivery distances and costs

#### Acceptance Criteria

1. WHEN viewing pricing configuration THEN the system SHALL display price columns for Zone 1 through Zone 5
2. IF a specific zone is selected THEN the system SHALL highlight that zone's price column
3. WHEN a zone has no configuration THEN the system SHALL display it as empty with option to configure
4. IF the user edits zone prices THEN the system SHALL support bulk copy and paste operations
5. WHEN saving zone prices AND Zone X price is lower than Zone X-1 THEN the system SHALL display a warning about price inconsistency

### Requirement 3: Price Table Import/Export

**User Story:** As a system administrator, I want to import Excel-formatted price tables, so that I can quickly migrate existing pricing data

#### Acceptance Criteria

1. WHEN clicking import button THEN the system SHALL accept Excel (.xlsx) and CSV format files
2. IF the file format is incorrect THEN the system SHALL display detailed error messages with format requirements
3. WHEN import is successful THEN the system SHALL display number of records imported and update status
4. WHEN exporting price table THEN the system SHALL generate a complete price matrix with all zones and skid counts
5. IF imported data conflicts with existing data THEN the system SHALL provide conflict resolution options (overwrite/skip/merge)

### Requirement 4: Accessorial Charges Configuration

**User Story:** As a finance officer, I want to configure special accessorial charges, so that special delivery situations are properly priced

#### Acceptance Criteria

1. WHEN configuring accessorial charges THEN the system SHALL support common items like tailgate service and residential delivery
2. IF an accessorial item is selected THEN the system SHALL allow setting fixed amount or percentage fees
3. WHEN accessorial charges are enabled THEN the system SHALL automatically include them in price calculations
4. WHEN viewing a quote THEN the system SHALL clearly display base price and accessorial charge breakdown
5. IF accessorial charges are modified THEN the system SHALL log the change history with effective dates

### Requirement 5: Real-Time Price Calculation

**User Story:** As a customer service representative, I want to get accurate quotes immediately after entering skid count and zone, so that I can quickly respond to customer inquiries

#### Acceptance Criteria

1. WHEN entering skid count THEN the system SHALL display calculated price within 500ms
2. IF a different zone is selected THEN the system SHALL update the price display in real-time
3. WHEN skid count exceeds configured range THEN the system SHALL use the highest skid tier's incremental rule
4. IF accessorial charges are included THEN the system SHALL display itemized charges and total price
5. WHEN price calculation is complete THEN the system SHALL provide a one-click copy quote function

## Non-Functional Requirements

### Performance
- Price calculation response time < 500ms
- Price table load time < 2 seconds
- Support 100 concurrent price queries
- Excel import of 10,000 records < 30 seconds

### Security
- Price configuration changes require administrator privileges
- All price changes logged in audit trail
- Sensitive pricing data transmitted via HTTPS
- Support price configuration versioning and rollback

### Reliability
- System availability > 99.9%
- Price calculation accuracy 100%
- Daily automated backups
- Support hot-reload of price configurations without system restart

### Usability
- Excel-like price table interface requiring no training
- Keyboard shortcuts for rapid editing
- Downloadable price configuration templates
- Real-time input validation to prevent configuration errors
- Multi-language support (Chinese/English)