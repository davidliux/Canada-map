# Bug Analysis: Pricing Configuration Save Issues

## Issue 1: NaN Value Warning

### Root Cause
In `PricingModePanel.jsx`, input fields are receiving undefined/null values that get converted to NaN. This happens when:
- Initial config values are not properly initialized
- parseFloat/parseInt is called on empty strings or undefined values

### Affected Code
`src/components/pricing/skid/PricingModePanel.jsx`
- Line ~150-300: Input value props without proper null checking

## Issue 2: 404 Error on Save (PUT vs POST)

### Root Cause
The save logic always uses PUT (update) even for new configurations because:
1. `currentConfig` is initialized with a new ID even when creating
2. The backend PUT endpoint returns 404 for non-existent configs
3. Should use POST for creation, PUT for updates

### Affected Code
1. `src/services/truckDeliveryApi.js:324-333`
   - `saveConfiguration` method always checks for config.id

2. `src/pages/TruckDelivery/UnifiedSkidPricingPage.jsx:182-194`
   - Always generates ID for new configs, making system think it's an update

## Fix Implementation Plan

### Fix 1: Handle NaN Values
1. Add proper default values and null checks in PricingModePanel
2. Ensure all numeric inputs have valid initial values
3. Add value validation before parseFloat/parseInt

### Fix 2: Correct Save Logic
1. Don't set ID for new configurations in frontend
2. Let backend generate ID for new configs
3. Check if currentConfig exists from database (not just created)
4. Use POST for new, PUT for existing

## Files to Modify
1. `src/components/pricing/skid/PricingModePanel.jsx` - Fix NaN issues
2. `src/pages/TruckDelivery/UnifiedSkidPricingPage.jsx` - Fix save logic
3. `src/services/truckDeliveryApi.js` - Ensure proper POST/PUT handling