// Pricing Model Configuration Component
// 服务商定价模型配置组件

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Package,
  Grid,
  TrendingUp,
  Table,
  Zap,
  AlertCircle,
  Check
} from 'lucide-react';

const PricingModelConfig = ({ providerId, providerName }) => {
  const [pricingModels, setPricingModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [activeConfigType, setActiveConfigType] = useState('WEIGHT_ZONE');

  useEffect(() => {
    if (providerId) {
      loadPricingModels();
    }
  }, [providerId]);

  const loadPricingModels = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/providers/${providerId}/pricing-models`);
      const data = await response.json();
      if (data.success) {
        setPricingModels(data.data || []);
      }
    } catch (error) {
      console.error('Error loading pricing models:', error);
    } finally {
      setLoading(false);
    }
  };

  const pricingTypes = [
    { 
      value: 'WEIGHT_ZONE', 
      label: '板数区间+Zone矩阵', 
      icon: Grid,
      description: '基于板数区间和配送区域的矩阵定价'
    },
    { 
      value: 'FIRST_CONT', 
      label: '首续模式', 
      icon: TrendingUp,
      description: '首板价格 + 续板价格'
    },
    { 
      value: 'FIXED_TABLE', 
      label: '固定价格表', 
      icon: Table,
      description: '预定义的固定价格表'
    },
    { 
      value: 'LINEAR', 
      label: '线性定价', 
      icon: Zap,
      description: '每板固定价格'
    }
  ];

  const getTypeIcon = (type) => {
    const config = pricingTypes.find(t => t.value === type);
    return config ? config.icon : DollarSign;
  };

  const handleAddModel = () => {
    setEditingModel(null);
    setShowForm(true);
  };

  const handleEditModel = (model) => {
    setEditingModel(model);
    setActiveConfigType(model.type);
    setShowForm(true);
  };

  const handleDeleteModel = async (modelId) => {
    if (!confirm('确定要删除此定价模型吗？')) return;

    try {
      const response = await fetch(`/api/v1/pricing-models/${modelId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        loadPricingModels();
      }
    } catch (error) {
      console.error('Error deleting model:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">定价模型配置</h2>
          <p className="text-gray-400 text-sm mt-1">{providerName}</p>
        </div>
        <button
          onClick={handleAddModel}
          className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          添加定价模型
        </button>
      </div>

      {/* 定价模型列表 */}
      <div className="grid grid-cols-1 gap-4">
        {pricingModels.map((model) => {
          const TypeIcon = getTypeIcon(model.type);
          const typeConfig = pricingTypes.find(t => t.value === model.type);
          
          return (
            <motion.div
              key={model.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900 rounded-lg border border-gray-800 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-800 rounded-lg">
                    <TypeIcon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{model.name}</h3>
                    <p className="text-gray-400 text-sm">{typeConfig?.description}</p>
                    
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-gray-500">
                        单位: <span className="text-gray-300">板数</span>
                      </span>
                      <span className="text-xs text-gray-500">
                        优先级: <span className="text-gray-300">{model.priority}</span>
                      </span>
                      {model.zones && model.zones.length > 0 && (
                        <span className="text-xs text-gray-500">
                          适用区域: <span className="text-gray-300">{model.zones.join(', ')}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {model.isActive ? (
                    <span className="px-2 py-1 bg-green-900/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      激活
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-900/20 text-gray-400 text-xs rounded-full">
                      未激活
                    </span>
                  )}
                  
                  <button
                    onClick={() => handleEditModel(model)}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-gray-400" />
                  </button>
                  
                  <button
                    onClick={() => handleDeleteModel(model.id)}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* 配置预览 */}
              <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
                {model.type === 'WEIGHT_ZONE' && (
                  <WeightZonePreview configuration={model.configuration} />
                )}
                {model.type === 'FIRST_CONT' && (
                  <FirstContPreview configuration={model.configuration} />
                )}
                {model.type === 'LINEAR' && (
                  <LinearPreview configuration={model.configuration} />
                )}
                {model.type === 'FIXED_TABLE' && (
                  <FixedTablePreview configuration={model.configuration} />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 空状态 */}
      {pricingModels.length === 0 && (
        <div className="text-center py-12 bg-gray-900 rounded-lg">
          <DollarSign className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">还没有配置定价模型</p>
          <button
            onClick={handleAddModel}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            添加第一个定价模型
          </button>
        </div>
      )}

      {/* 配置表单弹窗 */}
      {showForm && (
        <PricingModelForm
          providerId={providerId}
          model={editingModel}
          type={activeConfigType}
          onSave={() => {
            setShowForm(false);
            loadPricingModels();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

// 板数区间预览组件
const WeightZonePreview = ({ configuration }) => {
  if (!configuration) return null;
  
  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400">板数区间定价</p>
      <div className="grid grid-cols-3 gap-2 text-xs">
        {configuration.weightRanges?.slice(0, 3).map((range, idx) => (
          <div key={idx} className="bg-gray-900 p-2 rounded">
            <span className="text-gray-400">{range.min}-{range.max}板:</span>
            <span className="text-white ml-1">Zone价格不等</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// 首续模式预览组件
const FirstContPreview = ({ configuration }) => {
  if (!configuration) return null;
  
  return (
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <span className="text-gray-400">首板价格:</span>
        <span className="text-white ml-2">${configuration.firstUnit?.price || 0}</span>
      </div>
      <div>
        <span className="text-gray-400">续板价格:</span>
        <span className="text-white ml-2">${configuration.continuationUnit?.price || 0}</span>
      </div>
    </div>
  );
};

// 线性定价预览组件
const LinearPreview = ({ configuration }) => {
  if (!configuration) return null;
  
  return (
    <div className="text-sm">
      <span className="text-gray-400">每板价格:</span>
      <span className="text-white ml-2">${configuration.pricePerUnit || 0}</span>
      {configuration.minimumCharge && (
        <span className="text-gray-400 ml-4">
          最低收费: <span className="text-white">${configuration.minimumCharge}</span>
        </span>
      )}
    </div>
  );
};

// 固定价格表预览组件
const FixedTablePreview = ({ configuration }) => {
  if (!configuration) return null;
  
  return (
    <div className="text-sm">
      <span className="text-gray-400">价格表条目:</span>
      <span className="text-white ml-2">{configuration.priceTable?.length || 0} 项</span>
    </div>
  );
};

// 定价模型表单组件
const PricingModelForm = ({ providerId, model, type, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: type || 'WEIGHT_ZONE',
    unit: 'PLATE', // 默认使用板作为单位
    configuration: {},
    zones: [],
    priority: 100,
    isActive: true,
    effectiveDate: new Date().toISOString().split('T')[0],
    expiryDate: ''
  });

  const [configType, setConfigType] = useState(type || 'WEIGHT_ZONE');

  useEffect(() => {
    if (model) {
      setFormData({
        ...model,
        effectiveDate: model.effectiveDate ? new Date(model.effectiveDate).toISOString().split('T')[0] : '',
        expiryDate: model.expiryDate ? new Date(model.expiryDate).toISOString().split('T')[0] : ''
      });
      setConfigType(model.type);
    }
  }, [model]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = model 
        ? `/api/v1/pricing-models/${model.id}`
        : `/api/v1/providers/${providerId}/pricing-models`;
      
      const response = await fetch(url, {
        method: model ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSave();
      }
    } catch (error) {
      console.error('Error saving pricing model:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-900 rounded-xl border border-gray-800 w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">
            {model ? '编辑定价模型' : '添加定价模型'}
          </h2>
          <button onClick={onCancel} className="p-2 hover:bg-gray-800 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* 基本信息 */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                模型名称 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="如：标准板数定价"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">定价类型</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'WEIGHT_ZONE', label: '板数区间+Zone矩阵', icon: Grid },
                  { value: 'FIRST_CONT', label: '首续模式', icon: TrendingUp },
                  { value: 'LINEAR', label: '线性定价', icon: Zap },
                  { value: 'FIXED_TABLE', label: '固定价格表', icon: Table }
                ].map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setConfigType(type.value);
                      setFormData({ ...formData, type: type.value });
                    }}
                    className={`p-3 rounded-lg border transition-all flex items-center gap-2 ${
                      configType === type.value
                        ? 'bg-cyan-900/30 border-cyan-500 text-cyan-400'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <type.icon className="w-4 h-4" />
                    <span className="text-sm">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 配置区域 */}
          <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
            <h3 className="text-lg font-medium text-white mb-4">定价配置</h3>
            
            {configType === 'WEIGHT_ZONE' && (
              <WeightZoneConfig 
                configuration={formData.configuration}
                onChange={(config) => setFormData({ ...formData, configuration: config })}
              />
            )}
            
            {configType === 'FIRST_CONT' && (
              <FirstContConfig
                configuration={formData.configuration}
                onChange={(config) => setFormData({ ...formData, configuration: config })}
              />
            )}
            
            {configType === 'LINEAR' && (
              <LinearConfig
                configuration={formData.configuration}
                onChange={(config) => setFormData({ ...formData, configuration: config })}
              />
            )}
            
            {configType === 'FIXED_TABLE' && (
              <FixedTableConfig
                configuration={formData.configuration}
                onChange={(config) => setFormData({ ...formData, configuration: config })}
              />
            )}
          </div>

          {/* 其他设置 */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm text-gray-400 mb-1">生效日期</label>
              <input
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">失效日期</label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
            </div>
          </div>
        </form>

        {/* 底部操作 */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            保存
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// 板数区间配置组件
const WeightZoneConfig = ({ configuration, onChange }) => {
  const [ranges, setRanges] = useState(configuration?.weightRanges || [
    { id: '1', min: 1, max: 2, label: '1-2板' },
    { id: '2', min: 3, max: 4, label: '3-4板' },
    { id: '3', min: 5, max: 8, label: '5-8板' },
    { id: '4', min: 9, max: 12, label: '9-12板' },
    { id: '5', min: 13, max: 16, label: '13-16板' },
    { id: '6', min: 17, max: 999, label: '16+板' }
  ]);

  const [zonePrices, setZonePrices] = useState(configuration?.zonePrices || []);

  const zones = ['Zone1', 'Zone2', 'Zone3', 'Zone4', 'Zone5'];

  useEffect(() => {
    onChange({ weightRanges: ranges, zonePrices });
  }, [ranges, zonePrices]);

  const updateZonePrice = (rangeId, zoneId, price) => {
    const newPrices = [...zonePrices];
    const index = newPrices.findIndex(p => p.weightRangeId === rangeId && p.zoneId === zoneId);
    
    if (index >= 0) {
      newPrices[index].price = parseFloat(price) || 0;
    } else {
      newPrices.push({
        weightRangeId: rangeId,
        zoneId: zoneId,
        price: parseFloat(price) || 0
      });
    }
    
    setZonePrices(newPrices);
  };

  const getZonePrice = (rangeId, zoneId) => {
    const price = zonePrices.find(p => p.weightRangeId === rangeId && p.zoneId === zoneId);
    return price ? price.price : '';
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">配置不同板数区间在各个Zone的价格</p>
      
      {/* 价格矩阵表格 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left text-xs text-gray-400">板数区间</th>
              {zones.map(zone => (
                <th key={zone} className="px-3 py-2 text-center text-xs text-gray-400">{zone}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ranges.map(range => (
              <tr key={range.id} className="border-t border-gray-700">
                <td className="px-3 py-2 text-sm text-gray-300">{range.label}</td>
                {zones.map(zone => (
                  <td key={zone} className="px-2 py-1">
                    <input
                      type="number"
                      value={getZonePrice(range.id, zone)}
                      onChange={(e) => updateZonePrice(range.id, zone, e.target.value)}
                      className="w-20 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm text-center"
                      placeholder="0"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 首续模式配置组件
const FirstContConfig = ({ configuration, onChange }) => {
  const [config, setConfig] = useState({
    firstUnit: configuration?.firstUnit || { quantity: 1, price: 150 },
    continuationUnit: configuration?.continuationUnit || { quantity: 1, price: 20 },
    maxPlatesPerVehicle: configuration?.maxPlatesPerVehicle || 8,
    priceCapPerVehicle: configuration?.priceCapPerVehicle || 1000
  });

  useEffect(() => {
    onChange(config);
  }, [config]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">首板数量</label>
          <input
            type="number"
            value={config.firstUnit.quantity}
            onChange={(e) => setConfig({
              ...config,
              firstUnit: { ...config.firstUnit, quantity: parseInt(e.target.value) || 1 }
            })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            min="1"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">首板价格 ($)</label>
          <input
            type="number"
            value={config.firstUnit.price}
            onChange={(e) => setConfig({
              ...config,
              firstUnit: { ...config.firstUnit, price: parseFloat(e.target.value) || 0 }
            })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">续板数量</label>
          <input
            type="number"
            value={config.continuationUnit.quantity}
            onChange={(e) => setConfig({
              ...config,
              continuationUnit: { ...config.continuationUnit, quantity: parseInt(e.target.value) || 1 }
            })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            min="1"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">续板价格 ($)</label>
          <input
            type="number"
            value={config.continuationUnit.price}
            onChange={(e) => setConfig({
              ...config,
              continuationUnit: { ...config.continuationUnit, price: parseFloat(e.target.value) || 0 }
            })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">每车最大板数</label>
          <input
            type="number"
            value={config.maxPlatesPerVehicle}
            onChange={(e) => setConfig({
              ...config,
              maxPlatesPerVehicle: parseInt(e.target.value) || 0
            })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">每车价格上限 ($)</label>
          <input
            type="number"
            value={config.priceCapPerVehicle}
            onChange={(e) => setConfig({
              ...config,
              priceCapPerVehicle: parseFloat(e.target.value) || 0
            })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            min="0"
            step="0.01"
          />
        </div>
      </div>
    </div>
  );
};

// 线性定价配置组件
const LinearConfig = ({ configuration, onChange }) => {
  const [config, setConfig] = useState({
    pricePerUnit: configuration?.pricePerUnit || 30,
    minimumCharge: configuration?.minimumCharge || 150,
    baseUnit: 'plate' // 固定使用板作为单位
  });

  useEffect(() => {
    onChange(config);
  }, [config]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">每板价格 ($)</label>
          <input
            type="number"
            value={config.pricePerUnit}
            onChange={(e) => setConfig({
              ...config,
              pricePerUnit: parseFloat(e.target.value) || 0
            })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            min="0"
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">最低收费 ($)</label>
          <input
            type="number"
            value={config.minimumCharge}
            onChange={(e) => setConfig({
              ...config,
              minimumCharge: parseFloat(e.target.value) || 0
            })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            min="0"
            step="0.01"
          />
        </div>
      </div>
    </div>
  );
};

// 固定价格表配置组件
const FixedTableConfig = ({ configuration, onChange }) => {
  const [priceTable, setPriceTable] = useState(configuration?.priceTable || [
    { key: 'Toronto', price: 150, priceType: 'perUnit' },
    { key: 'Vancouver', price: 180, priceType: 'perUnit' },
    { key: 'Montreal', price: 160, priceType: 'perUnit' }
  ]);

  useEffect(() => {
    onChange({ priceTable });
  }, [priceTable]);

  const addRow = () => {
    setPriceTable([...priceTable, { key: '', price: 0, priceType: 'perUnit' }]);
  };

  const updateRow = (index, field, value) => {
    const newTable = [...priceTable];
    newTable[index][field] = field === 'price' ? parseFloat(value) || 0 : value;
    setPriceTable(newTable);
  };

  const removeRow = (index) => {
    setPriceTable(priceTable.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {priceTable.map((row, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={row.key}
              onChange={(e) => updateRow(index, 'key', e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              placeholder="城市/区域"
            />
            <input
              type="number"
              value={row.price}
              onChange={(e) => updateRow(index, 'price', e.target.value)}
              className="w-32 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              placeholder="价格"
              min="0"
              step="0.01"
            />
            <select
              value={row.priceType}
              onChange={(e) => updateRow(index, 'priceType', e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            >
              <option value="perUnit">每板</option>
              <option value="fixed">固定</option>
            </select>
            <button
              type="button"
              onClick={() => removeRow(index)}
              className="p-2 hover:bg-gray-800 rounded-lg"
            >
              <Trash2 className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        ))}
      </div>
      
      <button
        type="button"
        onClick={addRow}
        className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        添加价格项
      </button>
    </div>
  );
};

export default PricingModelConfig;