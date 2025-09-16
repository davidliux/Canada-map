/**
 * 卡车配送区域管理页面
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Plus, Layers } from 'lucide-react';
import CityManager from '../../components/cities/CityManager';
import CityRegionEditor from '../../components/cities/CityRegionEditor';
import cityDatabaseService from '../../utils/storage/cityDatabaseService';
import { dataUpdateNotifier } from '../../utils/dataUpdateNotifier';

const RegionsPage = () => {
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 加载城市数据
  const loadCities = async (maintainSelection = false) => {
    try {
      setIsLoading(true);
      const citiesData = await cityDatabaseService.getAllCities();
      setCities(citiesData);

      // 如果需要保持当前选择，且当前有选中的城市，则更新选中城市的数据
      if (maintainSelection && selectedCity) {
        const updatedCity = citiesData.find(c => c.id === selectedCity.id);
        if (updatedCity) {
          const fullCity = await cityDatabaseService.getCity(updatedCity.id);
          setSelectedCity(fullCity);
        }
      }
      // 否则，如果有城市且没有选中的，默认选择第一个
      else if (citiesData.length > 0 && !selectedCity) {
        const fullCity = await cityDatabaseService.getCity(citiesData[0].id);
        setSelectedCity(fullCity);
      }
    } catch (error) {
      console.error('加载城市数据失败:', error);
      alert('无法连接到数据库，请确保后端服务已启动');
    } finally {
      setIsLoading(false);
    }
  };

  // 初始化和数据更新监听
  useEffect(() => {
    loadCities();

    const unsubscribe = dataUpdateNotifier.subscribe((updateInfo) => {
      if (updateInfo.type === 'city_updated' || updateInfo.type === 'city_deleted') {
        loadCities();
      }
    });

    return unsubscribe;
  }, []);

  // 处理城市选择
  const handleCitySelect = async (city) => {
    try {
      const fullCity = await cityDatabaseService.getCity(city.id);
      setSelectedCity(fullCity);
    } catch (error) {
      console.error('加载城市详情失败:', error);
      alert('加载城市详情失败，请重试');
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-blue-400">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  if (cities.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">暂无城市配置</h2>
          <p className="text-gray-500 mb-6">请先在城市管理中创建城市</p>
          <button
            onClick={() => window.location.href = '/management/truck-delivery/cities'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            前往城市管理
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Layers className="w-6 h-6" />
          区域配置管理
        </h1>
        <p className="text-gray-400 mt-2">
          为每个城市配置1-10个配送区域，并分配FSA代码
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 城市列表 */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            <h2 className="text-lg font-semibold text-white mb-4">
              选择城市
            </h2>
            <div className="space-y-2">
              {cities.map(city => (
                <button
                  key={city.id}
                  onClick={() => handleCitySelect(city)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedCity?.id === city.id
                      ? 'bg-blue-900/30 border-2 border-blue-500'
                      : 'bg-gray-700 hover:bg-gray-600 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: city.themeColor }}
                      />
                      <span className="font-medium text-white">
                        {city.name}
                      </span>
                    </div>
                    <span className="text-sm text-gray-400">
                      {city.regionCount || 0} 区域
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 区域编辑器 */}
        <div className="lg:col-span-2">
          {selectedCity ? (
            <CityRegionEditor
              cityData={selectedCity}
              onCityChange={async (updatedCity) => {
                try {
                  const success = await cityDatabaseService.saveCity(updatedCity);
                  if (success) {
                    setSelectedCity(updatedCity);
                    loadCities(true);  // 刷新城市列表，但保持当前选择
                    console.log('✅ 区域配置已保存到数据库');
                  } else {
                    alert('保存失败，请检查数据并重试');
                  }
                } catch (error) {
                  console.error('保存区域配置失败:', error);
                  alert('保存失败：' + error.message);
                }
              }}
            />
          ) : (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">
                请选择一个城市以配置区域
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegionsPage;