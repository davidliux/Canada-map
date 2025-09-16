import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Filter, X, ChevronDown } from 'lucide-react';
import { getAllCities, getCityMapView, getCityFSAs } from '../data/cityFSAMapping';
import { getRegionFSAs } from '../utils/unifiedStorage';

// 简单的区域颜色配置
const regionColors = {
  1: '#3B82F6', // 蓝色
  2: '#10B981', // 绿色
  3: '#8B5CF6', // 紫色
  4: '#F97316', // 橙色
  5: '#EF4444', // 红色
  6: '#06B6D4', // 青色
  7: '#EC4899', // 粉色
  8: '#EAB308'  // 黄色
};

const getRegionColor = (regionId) => {
  return regionColors[regionId] || '#6B7280';
};

const getRegionLabelStyle = (regionId) => {
  const color = getRegionColor(regionId);
  return {
    backgroundColor: color + '20',
    borderColor: color,
    color: color,
    borderWidth: '1px',
    borderStyle: 'solid'
  };
};

const CityRegionNavigator = ({ onCitySelect, onRegionSelect, selectedRegions = [], onClear }) => {
  const [cities] = useState(getAllCities());
  const [selectedCity, setSelectedCity] = useState(null);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [availableRegions, setAvailableRegions] = useState([]);
  const [regionFSAs, setRegionFSAs] = useState({});

  // 加载可用的区域
  useEffect(() => {
    const loadRegions = async () => {
      const regions = [];
      const fsaMap = {};

      for (let i = 1; i <= 8; i++) {
        const fsas = await getRegionFSAs(i.toString());
        if (fsas && fsas.length > 0) {
          regions.push(i);
          fsaMap[i] = fsas;
        }
      }

      setAvailableRegions(regions);
      setRegionFSAs(fsaMap);
    };

    loadRegions();
  }, []);

  // 处理城市选择
  const handleCitySelect = (cityName) => {
    setSelectedCity(cityName);
    setShowCityDropdown(false);

    const mapView = getCityMapView(cityName);
    const cityFSAs = getCityFSAs(cityName);

    if (onCitySelect) {
      onCitySelect({
        city: cityName,
        center: mapView.center,
        zoom: mapView.zoom,
        fsaCodes: cityFSAs
      });
    }
  };

  // 处理区域选择/取消选择
  const handleRegionToggle = (regionId) => {
    const regionStr = regionId.toString();
    let newSelectedRegions;

    if (selectedRegions.includes(regionStr)) {
      // 取消选择
      newSelectedRegions = selectedRegions.filter(r => r !== regionStr);
    } else {
      // 选择
      newSelectedRegions = [...selectedRegions, regionStr];
    }

    if (onRegionSelect) {
      onRegionSelect(newSelectedRegions);
    }
  };

  // 清除所有选择
  const handleClearAll = () => {
    setSelectedCity(null);
    if (onClear) {
      onClear();
    }
  };

  return (
    <div className="absolute top-16 left-4 z-20 space-y-3">
      {/* 城市选择器 */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-gray-800/95 backdrop-blur-sm rounded-lg border border-gray-700 shadow-xl"
      >
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-cyan-500" />
              <span className="text-white font-medium text-sm">城市快速定位</span>
            </div>
            {selectedCity && (
              <button
                onClick={handleClearAll}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 城市下拉选择 */}
          <div className="relative">
            <button
              onClick={() => setShowCityDropdown(!showCityDropdown)}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white text-sm flex items-center justify-between hover:bg-gray-600 transition-colors"
            >
              <span>{selectedCity || '选择城市'}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showCityDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showCityDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full mt-2 w-full bg-gray-700 rounded-lg border border-gray-600 shadow-xl max-h-64 overflow-y-auto"
              >
                {cities.map(city => (
                  <button
                    key={city}
                    onClick={() => handleCitySelect(city)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-600 transition-colors ${
                      selectedCity === city ? 'bg-gray-600 text-cyan-400' : 'text-white'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* 区域筛选器 */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-800/95 backdrop-blur-sm rounded-lg border border-gray-700 shadow-xl"
      >
        <div className="p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Filter className="w-4 h-4 text-purple-500" />
            <span className="text-white font-medium text-sm">区域筛选</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {availableRegions.map(regionId => {
              const isSelected = selectedRegions.includes(regionId.toString());
              const style = getRegionLabelStyle(regionId);

              return (
                <button
                  key={regionId}
                  onClick={() => handleRegionToggle(regionId)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    isSelected
                      ? 'ring-2 ring-offset-1 ring-offset-gray-800'
                      : 'hover:scale-105'
                  }`}
                  style={{
                    ...style,
                    backgroundColor: isSelected ? getRegionColor(regionId, 'primary') + '40' : style.backgroundColor,
                    ringColor: isSelected ? getRegionColor(regionId, 'primary') : 'transparent'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span>区域 {regionId}</span>
                    {regionFSAs[regionId] && (
                      <span className="text-xs opacity-70">
                        ({regionFSAs[regionId].length})
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedRegions.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  已选择 {selectedRegions.length} 个区域
                </span>
                <button
                  onClick={() => onRegionSelect && onRegionSelect([])}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  清除筛选
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* 操作提示 */}
      {selectedCity && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-blue-900/50 backdrop-blur-sm rounded-lg border border-blue-700 p-3"
        >
          <div className="flex items-start space-x-2">
            <Navigation className="w-4 h-4 text-blue-400 mt-0.5" />
            <div>
              <p className="text-blue-200 text-xs">
                已定位到 <span className="font-medium text-blue-100">{selectedCity}</span>
              </p>
              {selectedRegions.length > 0 && (
                <p className="text-blue-300 text-xs mt-1">
                  点击区域可进一步聚焦
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CityRegionNavigator;