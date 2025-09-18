import React, { useState, useEffect } from 'react';
import {
  Package,
  TrendingUp,
  Truck,
  Layers,
  Save,
  AlertCircle,
  Check,
  Settings,
  ChevronDown,
  ChevronRight,
  Building2,
  MapPin,
  Users,
  Plus,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import pricingServiceV2 from '../../services/pricingServiceV2';

const PricingConfigPageV2 = () => {
  const [cities, setCities] = useState([]);
  const [zones, setZones] = useState({});
  const [groups, setGroups] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 选中的项目
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedMode, setSelectedMode] = useState('skid');
  const [pricingData, setPricingData] = useState({});

  // UI状态
  const [expandedCities, setExpandedCities] = useState({});
  const [activeTab, setActiveTab] = useState('selection');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const modeOptions = [
    {
      id: 'skid',
      name: '板数定价',
      icon: Package,
      description: '每个板数设置固定价格',
      color: 'cyan'
    },
    {
      id: 'first_cont',
      name: '首续托定价',
      icon: Layers,
      description: '首托和续托差异化定价',
      color: 'green'
    },
    {
      id: 'per_skid',
      name: '每板定价',
      icon: TrendingUp,
      description: '统一每板价格',
      color: 'purple'
    },
    {
      id: 'full_truck',
      name: '整车定价',
      icon: Truck,
      description: '整车固定价格',
      color: 'orange'
    }
  ];

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    // 当选择的定价模式改变时，重置定价数据
    setPricingData(getDefaultPricingData(selectedMode));
  }, [selectedMode]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // 加载城市
      const citiesResponse = await fetch('/api/v1/truck-delivery/cities');
      const citiesData = await citiesResponse.json();

      if (citiesData.success) {
        setCities(citiesData.data);

        // 为每个城市加载区域和分组
        const zonesTemp = {};
        const groupsTemp = {};

        for (const city of citiesData.data) {
          // 加载区域
          try {
            const zonesResp = await fetch(`/api/v1/truck-delivery/zones?city_id=${city.id}`);
            const zonesData = await zonesResp.json();
            if (zonesData.success) {
              zonesTemp[city.id] = zonesData.data;
            }
          } catch (error) {
            console.error(`Failed to load zones for city ${city.id}:`, error);
            zonesTemp[city.id] = [];
          }

          // 加载分组
          try {
            const groupsResp = await fetch(`/api/v1/truck-delivery/fsa-groups?city_id=${city.id}`);
            const groupsData = await groupsResp.json();
            if (groupsData.success) {
              groupsTemp[city.id] = groupsData.data;
            }
          } catch (error) {
            console.error(`Failed to load groups for city ${city.id}:`, error);
            groupsTemp[city.id] = [];
          }
        }

        setZones(zonesTemp);
        setGroups(groupsTemp);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultPricingData = (mode) => {
    switch (mode) {
      case 'skid':
        return {
          prices: {
            '1': 90, '2': 108, '3': 126, '4': 144, '5': 162,
            '6': 180, '7': 198, '8': 216, '9': 234, '10': 252,
            '11': 270, '12': 288, '13': 306, '14': 324, '15': 342,
            '16': 360, '16+': 378
          }
        };
      case 'first_cont':
        return {
          first_skid: 100,
          cont_skid: 20,
          max_skids: 16
        };
      case 'per_skid':
        return {
          price_per_skid: 25,
          min_skids: 1
        };
      case 'full_truck':
        return {
          truck_price: 500,
          max_skids: 16
        };
      default:
        return {};
    }
  };

  const toggleCityExpansion = (cityId) => {
    setExpandedCities(prev => ({
      ...prev,
      [cityId]: !prev[cityId]
    }));
  };

  const handleItemSelection = (type, id, cityId = null, parentType = null, parentId = null) => {
    const itemKey = `${type}_${id}_${cityId || ''}`;

    setSelectedItems(prev => {
      const isSelected = prev.some(item => item.key === itemKey);

      if (isSelected) {
        // 取消选择时，同时取消子项的选择
        if (type === 'city') {
          // 取消所有该城市的区域和分组
          return prev.filter(item =>
            !item.key.startsWith(`zone_`) || !item.key.includes(`_${id}`)
          ).filter(item =>
            !item.key.startsWith(`group_`) || !item.key.includes(`_${id}`)
          ).filter(item => item.key !== itemKey);
        } else if (type === 'zone') {
          // 取消该区域的所有分组
          return prev.filter(item =>
            !(item.parentType === 'zone' && item.parentId === id)
          ).filter(item => item.key !== itemKey);
        } else {
          return prev.filter(item => item.key !== itemKey);
        }
      } else {
        // 添加选择
        const newItem = {
          key: itemKey,
          type,
          id,
          cityId,
          parentType,
          parentId,
          name: type === 'city' ? cities.find(c => c.id === id)?.name :
                type === 'zone' ? zones[cityId]?.find(z => z.id === id)?.name :
                groups[cityId]?.find(g => g.id === id)?.name
        };

        return [...prev, newItem];
      }
    });
  };

  const isItemSelected = (type, id, cityId = null) => {
    const itemKey = `${type}_${id}_${cityId || ''}`;
    return selectedItems.some(item => item.key === itemKey);
  };

  const handleSaveConfig = async () => {
    if (selectedItems.length === 0) {
      alert('请至少选择一个城市、区域或分组');
      return;
    }

    setSaving(true);
    const configs = [];

    // 为每个选中的项目创建配置
    for (const item of selectedItems) {
      const config = {
        city_id: item.type === 'city' ? item.id : item.cityId,
        level: item.type,
        pricing_mode: selectedMode,
        pricing_data: {
          mode: selectedMode,
          ...pricingData
        },
        is_active: true,
        name: `${item.name} - ${modeOptions.find(m => m.id === selectedMode)?.name}`,
        priority: item.type === 'group' ? 3 : item.type === 'zone' ? 2 : 1
      };

      if (item.type === 'zone') {
        config.zone_id = item.id;
      } else if (item.type === 'group') {
        config.group_id = item.id;
        if (item.parentType === 'zone') {
          config.zone_id = item.parentId;
        }
      }

      configs.push(config);
    }

    // 批量保存配置
    let successCount = 0;
    for (const config of configs) {
      try {
        const response = await pricingServiceV2.saveConfig(config);
        if (response.success) {
          successCount++;
        }
      } catch (error) {
        console.error('Failed to save config:', error);
      }
    }

    setSaving(false);

    if (successCount > 0) {
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);

      // 清空选择
      setSelectedItems([]);
      setPricingData(getDefaultPricingData(selectedMode));
    }
  };

  const renderPricingForm = () => {
    switch (selectedMode) {
      case 'skid':
        return (
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-white font-medium mb-4">板数价格配置</h4>
            <div className="grid grid-cols-4 gap-3">
              {[...Array(16)].map((_, i) => {
                const key = i === 15 ? '16+' : String(i + 1);
                return (
                  <div key={key} className="bg-gray-900 rounded-lg p-3">
                    <label className="block text-sm text-gray-400 mb-1">{key}板:</label>
                    <input
                      type="number"
                      value={pricingData.prices?.[key] || ''}
                      onChange={(e) => {
                        setPricingData(prev => ({
                          ...prev,
                          prices: {
                            ...prev.prices,
                            [key]: parseFloat(e.target.value) || 0
                          }
                        }));
                      }}
                      className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white"
                      placeholder="价格"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'first_cont':
        return (
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-white font-medium mb-4">首续托价格配置</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-900 rounded-lg p-4">
                <label className="block text-sm text-gray-400 mb-2">首托价格</label>
                <input
                  type="number"
                  value={pricingData.first_skid || ''}
                  onChange={(e) => setPricingData(prev => ({ ...prev, first_skid: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                />
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <label className="block text-sm text-gray-400 mb-2">续托价格</label>
                <input
                  type="number"
                  value={pricingData.cont_skid || ''}
                  onChange={(e) => setPricingData(prev => ({ ...prev, cont_skid: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                />
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <label className="block text-sm text-gray-400 mb-2">最大板数</label>
                <input
                  type="number"
                  value={pricingData.max_skids || ''}
                  onChange={(e) => setPricingData(prev => ({ ...prev, max_skids: parseInt(e.target.value) || 16 }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                />
              </div>
            </div>
          </div>
        );

      case 'per_skid':
        return (
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-white font-medium mb-4">每板单价配置</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900 rounded-lg p-4">
                <label className="block text-sm text-gray-400 mb-2">每板价格</label>
                <input
                  type="number"
                  value={pricingData.price_per_skid || ''}
                  onChange={(e) => setPricingData(prev => ({ ...prev, price_per_skid: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                />
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <label className="block text-sm text-gray-400 mb-2">最小板数</label>
                <input
                  type="number"
                  value={pricingData.min_skids || ''}
                  onChange={(e) => setPricingData(prev => ({ ...prev, min_skids: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                />
              </div>
            </div>
          </div>
        );

      case 'full_truck':
        return (
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-white font-medium mb-4">整车定价配置</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900 rounded-lg p-4">
                <label className="block text-sm text-gray-400 mb-2">整车价格</label>
                <input
                  type="number"
                  value={pricingData.truck_price || ''}
                  onChange={(e) => setPricingData(prev => ({ ...prev, truck_price: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                />
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <label className="block text-sm text-gray-400 mb-2">最大板数</label>
                <input
                  type="number"
                  value={pricingData.max_skids || ''}
                  onChange={(e) => setPricingData(prev => ({ ...prev, max_skids: parseInt(e.target.value) || 16 }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">加载数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Settings className="w-8 h-8 text-cyan-400" />
            定价配置管理
          </h1>
          <p className="text-gray-400">
            选择城市、区域或分组，配置统一的定价策略
          </p>
        </div>

        {/* 成功提示 */}
        <AnimatePresence>
          {showSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4 p-4 bg-green-900/20 border border-green-800 rounded-lg flex items-center gap-2"
            >
              <Check className="w-5 h-5 text-green-400" />
              <span className="text-green-400">配置保存成功！</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 主界面 */}
        <div className="bg-gray-900 rounded-xl p-6">
          {/* Tab切换 */}
          <div className="flex gap-4 mb-6 border-b border-gray-800">
            <button
              onClick={() => setActiveTab('selection')}
              className={`pb-3 px-1 transition-colors ${
                activeTab === 'selection'
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              1. 选择配置对象
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`pb-3 px-1 transition-colors ${
                activeTab === 'pricing'
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              2. 配置定价
            </button>
          </div>

          {activeTab === 'selection' ? (
            <div>
              {/* 城市/区域/分组选择 */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-4">选择要配置的对象</h3>
                <div className="bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
                  {cities.map(city => (
                    <div key={city.id} className="mb-3">
                      <div className="flex items-center gap-3 p-2 hover:bg-gray-700/50 rounded">
                        <button
                          onClick={() => toggleCityExpansion(city.id)}
                          className="text-gray-400 hover:text-white"
                        >
                          {expandedCities[city.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <input
                          type="checkbox"
                          checked={isItemSelected('city', city.id)}
                          onChange={() => handleItemSelection('city', city.id)}
                          className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                        />
                        <Building2 className="w-4 h-4 text-blue-400" />
                        <span className="text-white font-medium">{city.name}</span>
                        <span className="text-gray-500 text-sm">（城市级配置）</span>
                      </div>

                      <AnimatePresence>
                        {expandedCities[city.id] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="ml-10 mt-2 space-y-2"
                          >
                            {/* 区域 */}
                            {zones[city.id]?.map(zone => (
                              <div key={zone.id} className="flex items-center gap-3 p-2 hover:bg-gray-700/30 rounded">
                                <input
                                  type="checkbox"
                                  checked={isItemSelected('zone', zone.id, city.id)}
                                  onChange={() => handleItemSelection('zone', zone.id, city.id)}
                                  className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                                />
                                <MapPin className="w-4 h-4 text-green-400" />
                                <span className="text-gray-300">{zone.name}</span>
                                <span className="text-gray-500 text-sm">（区域级配置）</span>
                              </div>
                            ))}

                            {/* 分组 */}
                            {groups[city.id]?.map(group => (
                              <div key={group.id} className="flex items-center gap-3 p-2 hover:bg-gray-700/30 rounded">
                                <input
                                  type="checkbox"
                                  checked={isItemSelected('group', group.id, city.id)}
                                  onChange={() => handleItemSelection('group', group.id, city.id)}
                                  className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                                />
                                <Users className="w-4 h-4 text-purple-400" />
                                <span className="text-gray-300">{group.name}</span>
                                <span className="text-gray-500 text-sm">（分组级配置）</span>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>

              {/* 已选择的项目 */}
              {selectedItems.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-white font-medium mb-3">已选择 ({selectedItems.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedItems.map(item => (
                      <div
                        key={item.key}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-lg"
                      >
                        <span className="text-cyan-400 text-sm">{item.name}</span>
                        <button
                          onClick={() => handleItemSelection(item.type, item.id, item.cityId, item.parentType, item.parentId)}
                          className="text-cyan-400 hover:text-cyan-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setActiveTab('pricing')}
                  disabled={selectedItems.length === 0}
                  className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一步：配置定价
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* 定价模式选择 */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-4">选择定价模式</h3>
                <div className="grid grid-cols-4 gap-3">
                  {modeOptions.map(mode => {
                    const Icon = mode.icon;
                    const isSelected = selectedMode === mode.id;

                    return (
                      <button
                        key={mode.id}
                        onClick={() => setSelectedMode(mode.id)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? `border-${mode.color}-500 bg-${mode.color}-500/10`
                            : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                        }`}
                      >
                        <Icon className={`w-8 h-8 mb-2 mx-auto text-${mode.color}-400`} />
                        <div className="text-sm font-medium text-white">{mode.name}</div>
                        <div className="text-xs text-gray-400 mt-1">{mode.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 定价配置表单 */}
              <div className="mb-6">
                {renderPricingForm()}
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-between">
                <button
                  onClick={() => setActiveTab('selection')}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  上一步
                </button>
                <button
                  onClick={handleSaveConfig}
                  disabled={saving}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? '保存中...' : '保存配置'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PricingConfigPageV2;