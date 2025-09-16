/**
 * 将localStorage中的FSA数据同步到数据库
 * 这个脚本应该在浏览器控制台中运行
 */

// 从localStorage获取数据
const regionData = localStorage.getItem('unifiedStorage_regionData');
if (!regionData) {
  console.error('没有找到区域数据');
} else {
  const regions = JSON.parse(regionData);

  // 准备要发送到后端的数据
  const dataToSync = [];

  Object.entries(regions).forEach(([regionId, regionConfig]) => {
    if (regionConfig && regionConfig.fsa && regionConfig.fsa.length > 0) {
      dataToSync.push({
        id: regionId,
        name: regionConfig.name || `区域 ${regionId}`,
        isActive: regionConfig.isActive !== false,
        postalCodes: regionConfig.fsa || [],
        weightRanges: regionConfig.prices ? Object.entries(regionConfig.prices).map(([range, price]) => {
          const [min, max] = range.split('-').map(v => parseFloat(v) || 0);
          return {
            name: range,
            minWeight: min,
            maxWeight: max || 999999,
            price: price.base || 0,
            isActive: true
          };
        }) : []
      });
    }
  });

  console.log('准备同步的数据:', dataToSync);

  // 同步到数据库
  dataToSync.forEach(async (region) => {
    try {
      const response = await fetch('http://localhost:5050/api/v1/regions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(region)
      });

      const result = await response.json();
      if (result.success) {
        console.log(`✅ 区域 ${region.name} 同步成功`);
      } else {
        console.error(`❌ 区域 ${region.name} 同步失败:`, result.error);
      }
    } catch (error) {
      console.error(`❌ 区域 ${region.name} 同步出错:`, error);
    }
  });
}