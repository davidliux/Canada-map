import React, { useState, useEffect } from 'react';
import {
  Package,
  TrendingUp,
  Truck,
  Layers,
  Save,
  AlertCircle,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import pricingServiceV2 from '../../services/pricingServiceV2';

const PricingConfigPage = () => {
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [zones, setZones] = useState([]);
  const [groups, setGroups] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedSection, setExpandedSection] = useState('city');
  const [editingConfig, setEditingConfig] = useState(null);
  const [newConfig, setNewConfig] = useState(null);

  const modeOptions = [
    {
      id: 'skid',
      name: '板数定价',
      icon: Package,
      description: '每个板数设置固定价格',
      color: 'blue'
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
    loadCities();
    loadConfigs();
  }, []);

  useEffect(() => {
    if (selectedCity) {
      loadZonesAndGroups(selectedCity);
    }
  }, [selectedCity]);

  const loadCities = async () => {
    try {
      const response = await fetch('/api/v1/truck-delivery/cities');
      const data = await response.json();
      if (data.success) {
        setCities(data.data);
        if (data.data.length > 0) {
          setSelectedCity(data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load cities:', error);
    }
  };

  const loadZonesAndGroups = async (cityId) => {
    try {
      // Load zones
      const zonesResponse = await fetch(`/api/v1/truck-delivery/zones?city_id=${cityId}`);
      const zonesData = await zonesResponse.json();
      if (zonesData.success) {
        setZones(zonesData.data);
      }

      // Load groups
      const groupsResponse = await fetch(`/api/v1/truck-delivery/fsa-groups?city_id=${cityId}`);
      const groupsData = await groupsResponse.json();
      if (groupsData.success) {
        setGroups(groupsData.data);
      }
    } catch (error) {
      console.error('Failed to load zones and groups:', error);
    }
  };

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const response = await pricingServiceV2.getAllConfigs();
      if (response.success) {
        setConfigs(response.data);
      }
    } catch (error) {
      console.error('Failed to load configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultConfig = (mode) => {
    switch (mode) {
      case 'skid':
        return {
          mode: 'skid',
          prices: {
            '1': 90, '2': 108, '3': 126, '4': 144, '5': 162,
            '6': 180, '7': 198, '8': 216, '9': 234, '10': 252,
            '11': 270, '12': 288, '13': 306, '14': 324, '15': 342,
            '16': 360, '16+': 378
          }
        };
      case 'first_cont':
        return {
          mode: 'first_cont',
          first_skid: 100,
          cont_skid: 20,
          max_skids: 16
        };
      case 'per_skid':
        return {
          mode: 'per_skid',
          price_per_skid: 25,
          min_skids: 1
        };
      case 'full_truck':
        return {
          mode: 'full_truck',
          truck_price: 500,
          max_skids: 16
        };
      default:
        return {};
    }
  };

  const handleAddConfig = (level) => {
    const baseConfig = {
      city_id: selectedCity,
      level: level,
      pricing_mode: 'skid',
      is_active: true,
      priority: level === 'group' ? 3 : level === 'zone' ? 2 : 1
    };

    if (level === 'zone') {
      baseConfig.zone_id = zones[0]?.id || '';
    } else if (level === 'group') {
      baseConfig.group_id = groups[0]?.id || '';
    }

    setNewConfig({
      ...baseConfig,
      pricing_data: getDefaultConfig('skid')
    });
  };

  const handleSaveConfig = async (config) => {
    setSaving(true);
    try {
      const response = await pricingServiceV2.saveConfig(config);
      if (response.success) {
        await loadConfigs();
        setEditingConfig(null);
        setNewConfig(null);
      }
    } catch (error) {
      console.error('Failed to save config:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfig = async (configId) => {
    if (!confirm('确定要删除这个配置吗？')) return;

    try {
      const response = await pricingServiceV2.deleteConfig(configId);
      if (response.success) {
        await loadConfigs();
      }
    } catch (error) {
      console.error('Failed to delete config:', error);
    }
  };

  const renderPricingForm = (data, onChange) => {
    const mode = data.pricing_mode || data.mode;
    const configData = data.pricing_data || data.config || {};

    switch (mode) {
      case 'skid':
        return (
          <div className="grid grid-cols-4 gap-2">
            {[...Array(16)].map((_, i) => {
              const key = i === 15 ? '16+' : String(i + 1);
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm w-8">{key}板:</span>
                  <input
                    type="number"
                    value={configData.prices?.[key] || ''}
                    onChange={(e) => {
                      const newPrices = { ...configData.prices, [key]: parseFloat(e.target.value) };
                      onChange({ ...configData, prices: newPrices });
                    }}
                    className="flex-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm"
                    placeholder="价格"
                  />
                </div>
              );
            })}
          </div>
        );

      case 'first_cont':
        return (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">首托价格</label>
              <input
                type="number"
                value={configData.first_skid || ''}
                onChange={(e) => onChange({ ...configData, first_skid: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">续托价格</label>
              <input
                type="number"
                value={configData.cont_skid || ''}
                onChange={(e) => onChange({ ...configData, cont_skid: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">最大板数</label>
              <input
                type="number"
                value={configData.max_skids || ''}
                onChange={(e) => onChange({ ...configData, max_skids: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              />
            </div>
          </div>
        );

      case 'per_skid':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">每板价格</label>
              <input
                type="number"
                value={configData.price_per_skid || ''}
                onChange={(e) => onChange({ ...configData, price_per_skid: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">最小板数</label>
              <input
                type="number"
                value={configData.min_skids || ''}
                onChange={(e) => onChange({ ...configData, min_skids: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              />
            </div>
          </div>
        );

      case 'full_truck':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">整车价格</label>
              <input
                type="number"
                value={configData.truck_price || ''}
                onChange={(e) => onChange({ ...configData, truck_price: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">最大板数</label>
              <input
                type="number"
                value={configData.max_skids || ''}
                onChange={(e) => onChange({ ...configData, max_skids: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderConfigSection = (level, title, items) => {
    const levelConfigs = configs.filter(c => c.level === level && c.city_id === selectedCity);
    const isExpanded = expandedSection === level;

    return (
      <div className="bg-gray-900 rounded-xl p-6 mb-4">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setExpandedSection(isExpanded ? null : level)}
        >
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <span className="text-sm text-gray-400">({levelConfigs.length} 配置)</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAddConfig(level);
            }}
            className="px-3 py-1 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            添加配置
          </button>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-4">
                {newConfig && newConfig.level === level && (
                  <div className="p-4 bg-gray-800 rounded-lg border border-cyan-500">
                    <div className="mb-4">
                      <label className="block text-sm text-gray-400 mb-2">定价模式</label>
                      <div className="grid grid-cols-4 gap-2">
                        {modeOptions.map(mode => (
                          <button
                            key={mode.id}
                            onClick={() => setNewConfig({
                              ...newConfig,
                              pricing_mode: mode.id,
                              pricing_data: getDefaultConfig(mode.id)
                            })}
                            className={`p-2 rounded-lg border ${
                              newConfig.pricing_mode === mode.id
                                ? 'border-cyan-500 bg-cyan-500/20'
                                : 'border-gray-700 bg-gray-800'
                            }`}
                          >
                            <mode.icon className="w-4 h-4 mx-auto mb-1" />
                            <div className="text-xs">{mode.name}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {level === 'zone' && (
                      <div className="mb-4">
                        <label className="block text-sm text-gray-400 mb-2">选择区域</label>
                        <select
                          value={newConfig.zone_id || ''}
                          onChange={(e) => setNewConfig({ ...newConfig, zone_id: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                        >
                          {zones.map(zone => (
                            <option key={zone.id} value={zone.id}>{zone.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {level === 'group' && (
                      <div className="mb-4">
                        <label className="block text-sm text-gray-400 mb-2">选择分组</label>
                        <select
                          value={newConfig.group_id || ''}
                          onChange={(e) => setNewConfig({ ...newConfig, group_id: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                        >
                          {groups.map(group => (
                            <option key={group.id} value={group.id}>{group.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="mb-4">
                      <label className="block text-sm text-gray-400 mb-2">配置名称</label>
                      <input
                        type="text"
                        value={newConfig.name || ''}
                        onChange={(e) => setNewConfig({ ...newConfig, name: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                        placeholder="输入配置名称"
                      />
                    </div>

                    <div className="mb-4">
                      {renderPricingForm(newConfig, (pricing_data) =>
                        setNewConfig({ ...newConfig, pricing_data })
                      )}
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setNewConfig(null)}
                        className="px-4 py-2 text-gray-400 hover:text-white"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => handleSaveConfig(newConfig)}
                        disabled={saving}
                        className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
                      >
                        {saving ? '保存中...' : '保存'}
                      </button>
                    </div>
                  </div>
                )}

                {levelConfigs.map(config => (
                  <div key={config.id} className="p-4 bg-gray-800 rounded-lg">
                    {editingConfig?.id === config.id ? (
                      <>
                        <div className="mb-4">
                          <label className="block text-sm text-gray-400 mb-2">定价模式</label>
                          <div className="grid grid-cols-4 gap-2">
                            {modeOptions.map(mode => (
                              <button
                                key={mode.id}
                                onClick={() => setEditingConfig({
                                  ...editingConfig,
                                  pricing_mode: mode.id,
                                  pricing_data: getDefaultConfig(mode.id)
                                })}
                                className={`p-2 rounded-lg border ${
                                  editingConfig.pricing_mode === mode.id
                                    ? 'border-cyan-500 bg-cyan-500/20'
                                    : 'border-gray-700 bg-gray-800'
                                }`}
                              >
                                <mode.icon className="w-4 h-4 mx-auto mb-1" />
                                <div className="text-xs">{mode.name}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="mb-4">
                          {renderPricingForm(editingConfig, (pricing_data) =>
                            setEditingConfig({ ...editingConfig, pricing_data })
                          )}
                        </div>

                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingConfig(null)}
                            className="px-4 py-2 text-gray-400 hover:text-white"
                          >
                            取消
                          </button>
                          <button
                            onClick={() => handleSaveConfig(editingConfig)}
                            disabled={saving}
                            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
                          >
                            {saving ? '保存中...' : '保存'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="text-white font-medium">{config.name || '未命名配置'}</h4>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-sm text-gray-400">
                                模式: {modeOptions.find(m => m.id === config.pricing_mode)?.name}
                              </span>
                              {config.zone_id && (
                                <span className="text-sm text-gray-400">
                                  区域: {zones.find(z => z.id === config.zone_id)?.name}
                                </span>
                              )}
                              {config.group_id && (
                                <span className="text-sm text-gray-400">
                                  分组: {groups.find(g => g.id === config.group_id)?.name}
                                </span>
                              )}
                              <span className={`text-sm ${config.is_active ? 'text-green-400' : 'text-gray-500'}`}>
                                {config.is_active ? '已启用' : '已禁用'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingConfig(config)}
                              className="p-2 text-cyan-400 hover:text-cyan-300"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteConfig(config.id)}
                              className="p-2 text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {levelConfigs.length === 0 && !newConfig && (
                  <div className="text-center py-8 text-gray-500">
                    暂无配置，点击上方"添加配置"按钮创建
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-1/3 mb-6"></div>
            <div className="h-64 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Settings className="w-8 h-8 text-cyan-400" />
            定价配置管理
          </h1>
          <p className="text-gray-400">
            管理城市、区域和分组的定价策略，支持四种灵活的定价模式
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">选择城市</label>
          <select
            value={selectedCity || ''}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
          >
            {cities.map(city => (
              <option key={city.id} value={city.id}>{city.name}</option>
            ))}
          </select>
        </div>

        {selectedCity && (
          <>
            {renderConfigSection('group', '分组定价配置（优先级最高）', groups)}
            {renderConfigSection('zone', '区域定价配置（优先级中等）', zones)}
            {renderConfigSection('city', '城市默认定价（优先级最低）', [])}
          </>
        )}
      </div>
    </div>
  );
};

export default PricingConfigPage;