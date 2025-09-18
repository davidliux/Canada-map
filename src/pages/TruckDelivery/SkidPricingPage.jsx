/**
 * 板数定价配置页面
 * 提供基于托盘数量的价格配置功能
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  DollarSign,
  Building2,
  AlertCircle,
  ArrowLeft,
  Download,
  Upload,
  Save,
  Settings,
  ChevronRight,
  MapPin,
  ToggleLeft,
  ToggleRight,
  Sliders
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SkidPricingMatrix from '../../components/pricing/skid/SkidPricingMatrix';
import CustomPricingPanel from '../../components/pricing/skid/CustomPricingPanel';
import FSAGroupPricingPanel from '../../components/pricing/skid/FSAGroupPricingPanel';
import IntegratedPricingMatrix from '../../components/pricing/skid/IntegratedPricingMatrix';
import PricingModeSelector from '../../components/pricing/PricingModeSelector';
import cityStorageService from '../../utils/storage/cityStorage';
import { dataUpdateNotifier } from '../../utils/dataUpdateNotifier';
import pricingService from '../../services/pricingService';

const SkidPricingPage = () => {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [zones, setZones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedZoneIndex, setSelectedZoneIndex] = useState(0);
  const [currentPricingData, setCurrentPricingData] = useState({});
  const [pricingMode, setPricingMode] = useState('fixed'); // 'fixed', 'advanced'
  const [showCustomPricing, setShowCustomPricing] = useState(false);
  const [zonePriceData, setZonePriceData] = useState({}); // 存储区域默认价格

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

  // 处理保存
  const handleSave = async () => {
    if (!selectedCity) {
      console.error('未选择城市');
      return;
    }

    try {
      setSaveStatus('saving');
      console.log('正在保存定价数据...', currentPricingData);

      // 调用API保存数据
      await pricingService.saveSkidPricing(selectedCity.id, currentPricingData);

      setSaveStatus('success');
      setHasChanges(false);
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error('保存失败:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  // 处理价格变更 - 从SkidPricingMatrix组件接收更新
  const handlePriceChange = (updatedData) => {
    setCurrentPricingData(updatedData);
    setHasChanges(true);
  };

  // 处理导出
  const handleExport = () => {
    console.log('导出板数定价配置');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400">
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
          <h2 className="text-xl font-semibold text-gray-300 mb-2">暂无城市配置</h2>
          <p className="text-gray-400 mb-6">请先在城市管理中创建城市</p>
          <button
            onClick={() => navigate('/management/truck-delivery/cities')}
            className="px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30
                     rounded-lg hover:bg-cyan-500/30 transition-colors"
          >
            前往城市管理
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-cyan-400" />
              价格配置管理
            </h1>
            <p className="text-gray-400">
              为每个区域设置独立的板数-价格配置表，支持批量导入和自定义规则
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg">
                <span className="text-sm text-gray-400">定价模式:</span>
                <select
                  value={pricingMode}
                  onChange={(e) => setPricingMode(e.target.value)}
                  className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-md text-sm text-white
                           focus:border-cyan-500 focus:outline-none"
                >
                  <option value="fixed">固定价格</option>
                  <option value="advanced">高级定价</option>
                </select>
              </div>
              <button
                onClick={() => navigate('/management/truck-delivery/pricing-config')}
                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg
                         hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                高级配置
              </button>
            </div>
          </div>
        </motion.div>

        {/* 主体内容区域 - 左右布局 */}
        <div className="flex gap-6">
          {/* 左侧城市列表 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="w-96 flex-shrink-0"
          >
            <div className="bg-gradient-to-br from-gray-900 to-gray-850 rounded-xl border border-gray-700 p-4">
              <h2 className="text-lg font-semibold text-white mb-4">选择城市</h2>
              <div className="space-y-2">
                {cities.map(city => (
                  <motion.button
                    key={city.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleCitySelect(city)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedCity?.id === city.id
                        ? 'bg-cyan-900/30 border-cyan-500 shadow-lg shadow-cyan-500/20'
                        : 'bg-gray-800/50 border-gray-700 hover:border-gray-600 hover:bg-gray-800/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium text-lg">{city.name}</p>
                        <p className="text-gray-400 text-sm mt-1">
                          {city.regionCount || 0} 区域
                        </p>
                      </div>
                      {selectedCity?.id === city.id && (
                        <ChevronRight className="w-5 h-5 text-cyan-400" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* 右侧价格配置区域 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1"
          >
            {selectedCity ? (
              <div className="space-y-6">
                {/* 顶部操作栏 */}
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-cyan-400" />
                    价格配置表
                  </h2>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleExport}
                      className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg
                               hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      批量导入
                    </button>
                    <button
                      className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg
                               hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      复制价格
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={!hasChanges}
                      className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                        hasChanges
                          ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                          : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Save className="w-4 h-4" />
                      保存
                    </button>
                  </div>
                </div>

                {/* 区域选择标签 */}
                <div className="flex gap-2">
                  {zones.map((zone, index) => (
                    <button
                      key={zone.id}
                      onClick={() => setSelectedZoneIndex(index)}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        index === selectedZoneIndex
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {zone.name || `区域${index + 1}`}
                    </button>
                  ))}
                </div>

                {/* 集成式价格配置界面 */}
                <IntegratedPricingMatrix
                  cityId={selectedCity.id}
                  zone={zones[selectedZoneIndex]}
                  mode={pricingMode === 'advanced' ? 'advanced' : 'fixed'}
                  onSave={(data) => {
                    setHasChanges(false);
                    setSaveStatus('success');
                    setTimeout(() => setSaveStatus(null), 3000);
                  }}
                  onChange={(data) => {
                    handlePriceChange(data);
                    setHasChanges(true);
                  }}
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">请从左侧选择一个城市以配置板数定价</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* 保存状态提示 */}
        {saveStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed bottom-4 right-4 bg-green-500/20 text-green-400
                        border border-green-500/30 rounded-lg px-4 py-2
                        flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            配置已保存
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SkidPricingPage;