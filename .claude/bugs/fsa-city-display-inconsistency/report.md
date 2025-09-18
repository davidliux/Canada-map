# Bug Report: FSA点击弹窗城市区域显示不一致

## Bug Summary
点击地图上的FSA色块时，弹窗显示的信息不一致。有些FSA显示具体的城市名称，而有些只显示省份名称，没有显示城市信息。

## Environment
- **Application**: 加拿大快递配送区域地图系统
- **Module**: 卡车配送地图 - FSA弹窗显示
- **Browser**: Not specified
- **Date Reported**: 2025-09-17

## Expected Behavior
所有FSA点击时都应该显示一致的信息格式，包括：
- 省份名称
- 城市名称（如果有）
- 配送区域
- FSA编码

## Actual Behavior
不同FSA显示的信息格式不一致：

### 情况1 - R2N FSA（Manitoba）
- 显示：所属城市 MB（实际是省份缩写）
- 缺失：具体城市名称
- 显示格式混乱：将省份显示在"所属城市"字段

### 情况2 - V2C FSA（BC）
- 显示：正确的省份（BC）
- 显示：正确的城市名称（Kamloops）
- 格式正确：城市信息显示在专门的字段

## Steps to Reproduce
1. 打开卡车配送地图页面
2. 点击Manitoba省的R2N FSA色块
3. 观察弹窗显示的信息（缺少城市名）
4. 点击BC省的V2C FSA色块
5. 观察弹窗显示的信息（正确显示城市名）

## Visual Evidence
- 图片1：R2N弹窗显示"所属城市 MB"，没有实际城市名
- 图片2：V2C弹窗正确显示"城市区域 Kamloops"

## Impact
- 用户体验不一致
- 信息展示混乱（省份被误标为城市）
- 部分FSA缺少重要的城市信息
- 可能影响用户对配送区域的理解

## Possible Causes
1. FSA数据不完整 - 某些FSA缺少城市字段
2. 显示逻辑问题 - 当城市数据缺失时，错误地使用省份数据填充
3. 数据加载问题 - 城市数据可能没有正确加载或映射
4. 字段映射错误 - 省份和城市字段可能存在混淆

## Additional Context
- 问题出现在弹窗组件的数据显示逻辑中
- 可能涉及FSA数据源的完整性问题
- 需要检查数据加载和字段映射逻辑