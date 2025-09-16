/**
 * 卡车配送价格管理页面
 */

import React, { useState, useEffect } from 'react';
import { DollarSign, Building2, AlertCircle, Settings, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EnhancedTruckPriceTable from '../../components/cities/EnhancedTruckPriceTable';
import cityStorageService from '../../utils/storage/cityStorage';
import { zoneApi } from '../../services/truckDeliveryApi';
import { dataUpdateNotifier } from '../../utils/dataUpdateNotifier';
// import PricingRuleManager from '../../components/pricing/PricingRuleManager'; // 组件待实现

const PricingPage = () => {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [zones, setZones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDynamicPricing, setShowDynamicPricing] = useState(false);

  // 加载城市数据
  const loadCities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const citiesData = await cityStorageService.getAllCities();
      setCities(citiesData);
      
      // 如果有城市，默认选择第一个
      if (citiesData.length > 0 && !selectedCity) {
        const city = citiesData[0];
        await handleCitySelect(city);
      }
    } catch (error) {
      console.error('加载城市数据失败:', error);
      setError('加载城市数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 加载区域数据
  const loadZones = async (cityId) => {
    if (!cityId) {
      setZones([]);
      return;
    }

    try {
      // 先尝试从API加载
      try {
        const apiZones = await zoneApi.getByCityId(cityId);
        if (apiZones && apiZones.length > 0) {
          setZones(apiZones);
          return;
        }
      } catch (apiError) {
        console.log('API加载失败，使用本地数据:', apiError);
      }

      // 从本地存储加载
      const cityData = await cityStorageService.getCity(cityId);
      if (cityData && cityData.regions) {
        setZones(cityData.regions);
      } else {
        setZones([]);
      }
    } catch (error) {
      console.error('加载区域数据失败:', error);
      setZones([]);
    }
  };

  // 初始化
  useEffect(() => {
    loadCities();

    const unsubscribe = dataUpdateNotifier.subscribe((updateInfo) => {
      if (updateInfo.type === 'city_updated' || updateInfo.type === 'city_deleted') {
        loadCities();
        if (selectedCity && updateInfo.cityId === selectedCity.id) {
          loadZones(selectedCity.id);
        }
      }
    });

    return unsubscribe;
  }, []);

  // 处理城市选择
  const handleCitySelect = async (city) => {
    setSelectedCity(city);
    await loadZones(city.id);
  };

  // 处理价格更新
  const handlePriceUpdate = () => {
    if (selectedCity) {
      loadZones(selectedCity.id);
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

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (cities.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">暂无城市配置</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">请先在城市管理中创建城市</p>
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
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <DollarSign className="w-6 h-6" />
              价格配置管理
            </h1>
            <p className="text-gray-400 mt-2">
              为每个区域设置独立的重量-价格配置表，支持批量导入
            </p>
          </div>
          <button
            onClick={() => setShowDynamicPricing(!showDynamicPricing)}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 
                     transition-colors flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            {showDynamicPricing ? '传统定价' : '动态定价'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 动态定价配置界面 */}
      {showDynamicPricing ? (
        <div className="space-y-6">
          {selectedCity ? (
            <>
              {/* <PricingRuleManager
                regionId={selectedCity.id}
                regionName={selectedCity.name}
              /> */}
              <div className="bg-gray-800 rounded-lg p-8 text-center">
                <Settings className="w-12 h-12 text-cyan-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">动态定价管理</h3>
                <p className="text-gray-400">动态定价管理组件正在开发中</p>
              </div>
            </>
          ) : (
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              <Settings className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">动态定价配置</h3>
              <p className="text-gray-400 mb-6">基于板数的灵活定价系统，支持多车辆和价格上限</p>
              
              {/* 城市快速选择 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
                {cities.map(city => (
                  <button
                    key={city.id}
                    onClick={() => setSelectedCity(city)}
                    className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: city.themeColor }}
                      />
                      <span className="text-white font-medium">{city.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 传统重量定价界面 */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 城市选择 */}
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

          {/* 价格表 */}
          <div className="lg:col-span-3">
            {selectedCity ? (
              zones.length > 0 ? (
                <EnhancedTruckPriceTable
                  cityId={selectedCity.id}
                  zones={zones}
                  onUpdate={handlePriceUpdate}
                />
              ) : (
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
                  <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">
                    该城市还没有配置区域
                  </p>
                  <button
                    onClick={() => window.location.href = '/management/truck-delivery/regions'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    前往区域配置
                  </button>
                </div>
              )
            ) : (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">
                  请选择一个城市以配置价格
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingPage;