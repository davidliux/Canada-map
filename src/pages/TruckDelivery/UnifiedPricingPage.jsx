/**
 * 统一定价管理页面
 * 提供卡车配送的统一价格配置功能
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  DollarSign,
  Settings,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  MapPin,
  Building2,
  Truck,
  Calculator,
  Hash,
  Layers,
  Upload,
  Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SkidPricingMatrix from '../../components/pricing/skid/SkidPricingMatrix';
import FSAGroupPricingPanel from '../../components/pricing/skid/FSAGroupPricingPanel';
import cityStorageService from '../../utils/storage/cityStorage';
import { dataUpdateNotifier } from '../../utils/dataUpdateNotifier';
import pricingService from '../../services/pricingService';

const UnifiedPricingPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('zones'); // zones | groups | cities
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [zones, setZones] = useState([]);
  const [fsaGroups, setFsaGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedZoneIndex, setSelectedZoneIndex] = useState(0);
  const [pricingData, setPricingData] = useState({});

  // 加载城市数据
  const loadCities = async () => {
    try {
      setIsLoading(true);
      const citiesData = await cityStorageService.getAllCities();
      setCities(citiesData);

      // 默认选择第一个城市
      if (citiesData.length > 0) {
        const defaultCity = citiesData[0];
        setSelectedCity(defaultCity);
        await loadCityData(defaultCity.id);
      }
    } catch (err) {
      console.error('加载城市数据失败:', err);
      setError('加载城市数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 加载城市相关数据
  const loadCityData = async (cityId) => {
    try {
      // 获取城市完整数据（包含zones）
      const cityData = await cityStorageService.getCity(cityId);

      if (cityData && cityData.zones) {
        setZones(cityData.zones || []);

        // 从zones中提取FSA分组
        const allGroups = [];
        cityData.zones.forEach(zone => {
          if (zone.fsaGroups && Array.isArray(zone.fsaGroups)) {
            allGroups.push(...zone.fsaGroups);
          }
        });
        setFsaGroups(allGroups);

        // 加载价格数据
        const pricing = {};
        for (const zone of cityData.zones) {
          const zonePrice = await pricingService.getSkidPricing(cityId, zone.id);
          pricing[zone.id] = zonePrice || {};
        }
        setPricingData(pricing);
      } else {
        setZones([]);
        setFsaGroups([]);
        setPricingData({});
      }
    } catch (err) {
      console.error('加载城市数据失败:', err);
      setError('加载城市数据失败');
    }
  };

  // 保存价格配置
  const handleSavePrice = async (zoneId, priceData) => {
    try {
      setSaveStatus('saving');
      await pricingService.saveSkidPricing(selectedCity.id, zoneId, priceData);

      // 更新本地状态
      setPricingData(prev => ({
        ...prev,
        [zoneId]: priceData
      }));

      setSaveStatus('success');
      setHasChanges(false);

      // 通知其他组件数据已更新
      dataUpdateNotifier.notify({
        type: 'pricing_update',
        data: { cityId: selectedCity.id, zoneId, priceData }
      });

      setTimeout(() => setSaveStatus(null), 2000);
    } catch (err) {
      console.error('保存价格失败:', err);
      setSaveStatus('error');
      setError('保存价格失败');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  // 批量导入价格
  const handleImportPrices = async (importedData) => {
    try {
      setSaveStatus('saving');

      // 批量保存所有价格
      for (const [zoneId, priceData] of Object.entries(importedData)) {
        await pricingService.saveSkidPricing(selectedCity.id, zoneId, priceData);
      }

      setPricingData(importedData);
      setSaveStatus('success');
      setHasChanges(false);

      setTimeout(() => setSaveStatus(null), 2000);
    } catch (err) {
      console.error('导入价格失败:', err);
      setSaveStatus('error');
      setError('导入价格失败');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  // 导出价格配置
  const handleExportPrices = () => {
    const exportData = {
      city: selectedCity?.name || 'unknown',
      cityId: selectedCity?.id,
      zones: zones.map(zone => ({
        id: zone.id,
        name: zone.name,
        prices: pricingData[zone.id] || {}
      })),
      exportTime: new Date().toISOString()
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `unified_pricing_${selectedCity?.id}_${Date.now()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  useEffect(() => {
    loadCities();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">加载统一定价配置...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* 页面头部 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/truck-delivery')}
                className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-8 h-8" />
                  统一定价管理
                </h1>
                <p className="text-blue-100 text-sm mt-1">
                  配置卡车配送的统一价格策略
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportPrices}
                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20
                         transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                导出配置
              </button>
              <label className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600
                               cursor-pointer transition-colors flex items-center gap-2">
                <Upload className="w-4 h-4" />
                导入配置
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        try {
                          const data = JSON.parse(event.target.result);
                          const importData = {};
                          data.zones?.forEach(zone => {
                            importData[zone.id] = zone.prices;
                          });
                          handleImportPrices(importData);
                        } catch (err) {
                          setError('导入文件格式错误');
                        }
                      };
                      reader.readAsText(file);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 城市选择器 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Building2 className="w-5 h-5 text-blue-400" />
              <span className="text-gray-300">选择城市：</span>
              <select
                value={selectedCity?.id || ''}
                onChange={(e) => {
                  const city = cities.find(c => c.id === e.target.value);
                  if (city) {
                    setSelectedCity(city);
                    loadCityData(city.id);
                  }
                }}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {cities.map(city => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
            {saveStatus && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  saveStatus === 'success' ? 'bg-green-500/20 text-green-400' :
                  saveStatus === 'error' ? 'bg-red-500/20 text-red-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}
              >
                {saveStatus === 'success' ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    保存成功
                  </>
                ) : saveStatus === 'error' ? (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    保存失败
                  </>
                ) : (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    保存中...
                  </>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* 标签页切换 */}
        <div className="flex gap-4 mb-6">
          {[
            { id: 'zones', label: '区域定价', icon: MapPin },
            { id: 'groups', label: '分组定价', icon: Layers },
            { id: 'cities', label: '城市定价', icon: Building2 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg flex items-center gap-2 transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        <div className="bg-gray-800 rounded-lg p-6">
          {activeTab === 'zones' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-400" />
                区域板数定价配置
              </h3>

              {/* 区域选择 */}
              <div className="flex gap-4 mb-6">
                {zones.map((zone, index) => (
                  <button
                    key={zone.id}
                    onClick={() => setSelectedZoneIndex(index)}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      selectedZoneIndex === index
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {zone.name}
                  </button>
                ))}
              </div>

              {/* 价格配置矩阵 */}
              {zones[selectedZoneIndex] && (
                <SkidPricingMatrix
                  zoneId={zones[selectedZoneIndex].id}
                  zoneName={zones[selectedZoneIndex].name}
                  initialData={pricingData[zones[selectedZoneIndex].id] || {}}
                  onSave={(priceData) => handleSavePrice(zones[selectedZoneIndex].id, priceData)}
                  onChange={() => setHasChanges(true)}
                />
              )}
            </div>
          )}

          {activeTab === 'groups' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-green-400" />
                分组自定义定价
              </h3>
              {selectedCity && zones.length > 0 ? (
                <FSAGroupPricingPanel
                  cityId={selectedCity.id}
                  zones={zones}
                  fsaGroups={fsaGroups}
                  onUpdate={() => loadCityData(selectedCity.id)}
                />
              ) : (
                <div className="bg-gray-700 rounded-lg p-6 text-center">
                  <p className="text-gray-400">请先选择城市以配置分组定价</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'cities' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-400" />
                城市级别定价策略
              </h3>
              <div className="bg-gray-700 rounded-lg p-6">
                <p className="text-gray-300">
                  城市级别的统一定价策略配置功能正在开发中...
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  此功能将允许您为整个城市设置默认的价格策略，并可以被区域和分组定价覆盖。
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedPricingPage;