import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Truck, Settings, MapPin } from 'lucide-react';
import TruckDeliveryMap from '../components/TruckDeliveryMap';
import { CITIES } from '../utils/storage/truckMapDataService.js';

/**
 * 卡车配送地图测试页面
 * 用于测试和演示TruckDeliveryMap组件的功能
 */
const MapTest = () => {
  const [selectedCity, setSelectedCity] = useState('多伦多');
  const [selectedRegions, setSelectedRegions] = useState([1, 2, 3]);
  const [showRegionLabels, setShowRegionLabels] = useState(true);
  const [enableViewportCulling, setEnableViewportCulling] = useState(true);
  const [simplifyBoundaries, setSimplifyBoundaries] = useState(true);

  const handleCityChange = (cityName) => {
    setSelectedCity(cityName);
    console.log('切换城市到:', cityName);
  };

  const handleRegionToggle = (regionId) => {
    setSelectedRegions(prev => 
      prev.includes(regionId)
        ? prev.filter(id => id !== regionId)
        : [...prev, regionId].sort()
    );
  };

  const handleCityClick = (data) => {
    console.log('城市地图点击事件:', data);
  };

  const handleRegionClick = (data) => {
    console.log('区域点击事件:', data);
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* 测试页面标题 */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <Truck className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">卡车配送地图测试</h1>
              <p className="text-gray-400 text-sm">TruckDeliveryMap 组件功能演示</p>
            </div>
          </div>

          {/* 控制面板 */}
          <div className="flex items-center space-x-6">
            {/* 城市选择 */}
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400 text-sm">城市:</span>
              <select
                value={selectedCity}
                onChange={(e) => handleCityChange(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white text-sm"
              >
                {Object.keys(CITIES).map(cityName => (
                  <option key={cityName} value={cityName}>
                    {cityName}
                  </option>
                ))}
              </select>
            </div>

            {/* 区域选择 */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm">区域:</span>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(regionId => (
                <button
                  key={regionId}
                  onClick={() => handleRegionToggle(regionId)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    selectedRegions.includes(regionId)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  {regionId}区
                </button>
              ))}
            </div>

            {/* 设置选项 */}
            <div className="flex items-center space-x-4">
              <Settings className="w-4 h-4 text-gray-400" />
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={showRegionLabels}
                  onChange={(e) => setShowRegionLabels(e.target.checked)}
                  className="rounded"
                />
                <span className="text-gray-300">显示标签</span>
              </label>
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={enableViewportCulling}
                  onChange={(e) => setEnableViewportCulling(e.target.checked)}
                  className="rounded"
                />
                <span className="text-gray-300">视口剔除</span>
              </label>
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={simplifyBoundaries}
                  onChange={(e) => setSimplifyBoundaries(e.target.checked)}
                  className="rounded"
                />
                <span className="text-gray-300">边界简化</span>
              </label>
            </div>
          </div>
        </div>

        {/* 状态信息 */}
        <div className="mt-3 flex items-center space-x-6 text-xs text-gray-400">
          <div>
            当前城市: <span className="text-white font-medium">{selectedCity}</span>
            {CITIES[selectedCity] && (
              <>
                <span className="mx-2">•</span>
                省份: <span className="text-white">{CITIES[selectedCity].province}</span>
                <span className="mx-2">•</span>
                优先级: <span className="text-white">{CITIES[selectedCity].priority}</span>
              </>
            )}
          </div>
          <div>
            选中区域: <span className="text-white font-medium">{selectedRegions.length}</span>个
            <span className="mx-2">•</span>
            区域列表: <span className="text-white">{selectedRegions.join(', ')}</span>
          </div>
        </div>
      </div>

      {/* 地图容器 */}
      <div className="flex-1">
        <TruckDeliveryMap
          selectedCity={selectedCity}
          selectedRegions={selectedRegions}
          showRegionLabels={showRegionLabels}
          enableViewportCulling={enableViewportCulling}
          simplifyBoundaries={simplifyBoundaries}
          onCityClick={handleCityClick}
          onRegionClick={handleRegionClick}
        />
      </div>

      {/* 调试信息面板 */}
      <div className="bg-gray-800 border-t border-gray-700 p-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-6 text-gray-400">
            <span>🚛 卡车配送地图组件测试</span>
            <span>城市: {selectedCity}</span>
            <span>区域: {selectedRegions.length}个</span>
            <span>标签: {showRegionLabels ? '显示' : '隐藏'}</span>
            <span>优化: {enableViewportCulling ? '启用' : '禁用'}</span>
            <span>简化: {simplifyBoundaries ? '启用' : '禁用'}</span>
          </div>
          <div className="text-gray-500">
            任务41-48已完成 • TruckDeliveryMap v1.0.0
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapTest;