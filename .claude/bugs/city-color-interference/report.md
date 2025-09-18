# Bug Report: 城市颜色相互干扰问题

## Bug ID
`city-color-interference`

## Summary
在卡车配送大屏中，点击BC省时会将AB省的颜色也变成BC省的黄色，点击AB省时会将BC省的颜色变成AB省的颜色。其他省份（ON、MB）不存在此问题。

## Environment
- **Browser**: Unknown
- **Operating System**: macOS
- **Application Version**: Current development version
- **Date Reported**: 2025-01-17

## Steps to Reproduce
1. 打开卡车配送大屏页面
2. 点击BC省
3. 观察AB省的颜色变化（变成BC省的黄色）
4. 刷新页面
5. 点击AB省
6. 观察BC省的颜色变化（变成AB省的颜色）

## Expected Behavior
- 点击某个省份时，只应该高亮显示该省份
- 其他省份的颜色不应该受到影响
- 每个省份应该保持自己的主题颜色

## Actual Behavior
- 点击BC省时，AB省的颜色也会变成BC省的黄色
- 点击AB省时，BC省的颜色也会变成AB省的颜色
- ON省和MB省之间没有这种相互影响

## Impact
- **Severity**: Medium
- **Priority**: P2
- **Affected Users**: 所有使用大屏查看配送网络的用户
- **Business Impact**: 影响用户体验，造成视觉混淆，可能导致误判省份状态

## Additional Context
- 只有AB和BC两个省份之间存在相互影响
- 其他省份（ON、MB、SK）正常工作
- 可能是ID冲突或数据关联错误导致