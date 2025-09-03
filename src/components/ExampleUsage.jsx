
/**
 * 增强邮编管理组件使用示例
 */

import React, { useState } from 'react';
import EnhancedPostalCodeManager from './components/EnhancedPostalCodeManager';

function ExampleUsage() {
  const [selectedRegion, setSelectedRegion] = useState('1');
  const [dataRefreshTrigger, setDataRefreshTrigger] = useState(0);

  const handleDataChange = () => {
    // 数据变更时刷新相关组件
    setDataRefreshTrigger(prev => prev + 1);
    console.log('邮编数据已更新');
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">邮编管理示例</h2>
      
      {/* 区域选择 */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">选择区域:</label>
        <select 
          value={selectedRegion} 
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        >
          {[1,2,3,4,5,6,7,8].map(i => (
            <option key={i} value={i.toString()}>区域 {i}</option>
          ))}
        </select>
      </div>
      
      {/* 邮编管理组件 */}
      <EnhancedPostalCodeManager
        selectedRegion={selectedRegion}
        onDataChange={handleDataChange}
        className="max-w-4xl"
      />
    </div>
  );
}

export default ExampleUsage;
