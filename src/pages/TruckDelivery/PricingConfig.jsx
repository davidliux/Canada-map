// Pricing Configuration Page
// Main page for dynamic pricing configuration management

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  MapPin, 
  Settings,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import PricingRuleList from '../../components/pricing/PricingRuleList';
import cityStorageService from '../../utils/storage/cityStorage';

const PricingConfig = () => {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [regions, setRegions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRegions();
  }, []);

  const loadRegions = async () => {
    try {
      // 从城市存储服务加载实际的城市数据
      const cities = await cityStorageService.getAllCities();
      console.log('PricingConfig - 加载的城市数据:', cities);
      
      // 如果没有城市数据，直接返回
      if (!cities || cities.length === 0) {
        console.log('PricingConfig - 没有城市数据');
        setRegions([]);
        setIsLoading(false);
        return;
      }
      
      // 将城市转换为区域格式
      const allRegions = [];
      
      // 简化处理：直接把每个城市作为一个区域
      for (const city of cities) {
        // 直接使用城市数据，不再获取详细信息
        allRegions.push({
          id: city.id,
          name: city.name,
          province: city.province,
          cityId: city.id,
          regionId: 'default',
          ruleCount: 0
        });
      }
      
      console.log('PricingConfig - 所有区域:', allRegions);
      setRegions(allRegions);
      
      // Auto-select first region if none selected
      if (!selectedRegion && allRegions.length > 0) {
        setSelectedRegion(allRegions[0]);
      }
    } catch (error) {
      console.error('PricingConfig - Error loading regions:', error);
      setRegions([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl font-bold text-white">动态定价配置</h1>
          </div>
          <p className="text-gray-400">
            配置基于板数的动态定价规则，支持多车辆分配和价格上限
          </p>
        </motion.div>

        {/* Region Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-semibold text-white">选择区域</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {regions.map(region => (
                <button
                  key={region.id}
                  onClick={() => setSelectedRegion(region)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedRegion?.id === region.id
                      ? 'bg-cyan-900/30 border-cyan-500'
                      : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-left">
                      <p className="text-white font-medium">{region.name}</p>
                      <p className="text-gray-400 text-sm">{region.province}</p>
                    </div>
                    {selectedRegion?.id === region.id && (
                      <ChevronRight className="w-5 h-5 text-cyan-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400 text-sm">
                      {region.ruleCount} 规则
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Pricing Rule Manager */}
        {selectedRegion ? (
          <motion.div
            key={selectedRegion.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <PricingRuleList
              regionId={selectedRegion.regionId}
              regionName={selectedRegion.name}
              cityId={selectedRegion.cityId}
            />
          </motion.div>
        ) : (
          <div className="bg-gray-900 rounded-lg p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">请选择一个区域以管理定价规则</p>
          </div>
        )}

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-gray-900/50 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-3">使用说明</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="text-cyan-400 font-medium mb-1">基础定价</h4>
              <p className="text-gray-400">
                设置初始板数范围的固定价格，例如1-2板收取$150
              </p>
            </div>
            <div>
              <h4 className="text-cyan-400 font-medium mb-1">增量定价</h4>
              <p className="text-gray-400">
                配置额外板数的计价方式：固定金额、百分比或分层定价
              </p>
            </div>
            <div>
              <h4 className="text-cyan-400 font-medium mb-1">车辆管理</h4>
              <p className="text-gray-400">
                设置每车最大板数和价格上限，系统自动处理多车分配
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PricingConfig;