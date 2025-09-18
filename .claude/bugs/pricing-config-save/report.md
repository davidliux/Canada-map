# Bug Report: Pricing Configuration Save Issues

## Bug ID
`pricing-config-save`

## Summary
Two critical issues preventing pricing configuration from being saved:
1. NaN value warning in input fields
2. 404 error when saving new configuration (using PUT instead of POST)

## Severity
High - Core functionality broken

## Environment
- Frontend: React 18 + Vite
- Backend: Node.js + Express + PostgreSQL
- Browser: Chrome/Safari
- Location: `/management/truck-delivery/unified-pricing`

## Steps to Reproduce
1. Navigate to unified pricing page
2. Select city, zone, and group
3. Configure pricing mode
4. Click "Save Configuration"
5. Observe console errors

## Expected Behavior
- No NaN warnings in console
- Configuration saves successfully
- Success notification appears

## Actual Behavior
- Console shows "Warning: Received NaN for the `value` attribute"
- Save fails with 404 error: "定价配置不存在" (Configuration doesn't exist)
- API incorrectly uses PUT for new configurations

## Error Messages
```
Warning: Received NaN for the `value` attribute
The specified value "NaN" cannot be parsed, or is out of range

PUT http://localhost:5050/api/v1/truck-delivery/pricing-configs/config_1758089180328 404 (Not Found)
API错误响应: {
  "status": 404,
  "error": {
    "code": "NOT_FOUND",
    "message": "定价配置不存在"
  }
}
```

## Root Cause Analysis
1. **NaN Issue**: Input fields receiving undefined/null values converted to NaN
2. **Save Issue**: Logic incorrectly determines new vs existing config, always using PUT

## Impact
- Users cannot save any pricing configurations
- Core functionality completely broken

## Priority
Critical - Blocks main feature