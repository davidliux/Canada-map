# Bug Report: 区域配置显示不一致

## Bug ID
`region-config-display-mismatch`

## Summary
区域配置管理页面左侧显示有5个已配置区域，但右侧区域配置面板显示"暂无区域配置"，数据未能正确同步显示。

## Environment
- **Browser**: Unknown
- **Operating System**: macOS
- **Application Version**: Current development version
- **Date Reported**: 2025-01-17

## Steps to Reproduce
1. 进入系统的"区域配置"管理页面
2. 查看左侧的"选择城市"列表
3. 观察右侧的"区域配置"面板

## Expected Behavior
- 左侧城市列表显示的区域数量应与右侧区域配置面板的数据保持一致
- 如果左侧显示有区域（如AB有5个区域），右侧应显示对应的区域配置详情

## Actual Behavior
- 左侧"选择城市"列表显示：
  - AB: 5个区域
  - BC: 5个区域
  - MB: 1个区域
  - ON: 5个区域
  - SK: 0个区域
- 右侧"区域配置"面板显示："暂无区域配置"
- 提示信息："点击"添加区域"开始配置城市的配送区域"

## Visual Evidence
截图显示了问题：左侧有区域数据，右侧显示无配置。

## Impact
- **Severity**: High
- **Priority**: P1
- **Affected Users**: 所有需要管理区域配置的用户
- **Business Impact**: 用户无法查看和管理已配置的区域，影响配送区域管理功能

## Additional Context
- 系统显示"管理城市的配送区域（最多10个）"
- 区域数量统计显示：0/10，总FSA数：0，已配置价格：0
- 可能是数据加载或状态同步问题