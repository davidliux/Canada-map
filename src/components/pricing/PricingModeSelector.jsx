import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, Truck, Layers, Save, AlertCircle, Check } from 'lucide-react';
import pricingService from '../../services/pricingService';

const PricingModeSelector = ({ cityId, zoneId, onModeChange, className = '' }) => {
  const [modes, setModes] = useState([]);
  const [activeMode, setActiveMode] = useState(null);
  const [selectedMode, setSelectedMode] = useState('palletBased');
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  const modeOptions = [
    {
      id: 'fixed',
      name: '固定价格',
      icon: Package,
      description: '每个板数设置固定价格',
      color: 'blue'
    },
    {
      id: 'palletBased',
      name: '首续托定价',
      icon: Layers,
      description: '首托和续托差异化定价',
      color: 'green'
    },
    {
      id: 'bulkDiscount',
      name: '批量折扣',
      icon: TrendingUp,
      description: '达到指定数量享受优惠',
      color: 'purple'
    },
    {
      id: 'fullTruck',
      name: '整车定价',
      icon: Truck,
      description: '整车固定价格',
      color: 'orange'
    }
  ];

  useEffect(() => {
    if (cityId && zoneId) {
      loadPricingModes();
    }
  }, [cityId, zoneId]);

  const loadPricingModes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await pricingService.getPricingModes(cityId, zoneId);
      if (response.success) {
        setModes(response.data.modes || []);
        setActiveMode(response.data.activeMode);

        // 如果有激活的模式，选中它
        if (response.data.activeMode) {
          const activeModeData = response.data.modes.find(m => m.modeType === response.data.activeMode);
          if (activeModeData) {
            setSelectedMode(activeModeData.modeType);
            setConfig(activeModeData.config || {});
          }
        } else {
          // 默认配置
          setConfig(getDefaultConfig('palletBased'));
        }
      }
    } catch (err) {
      setError('加载定价模式失败');
      console.error('Error loading pricing modes:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultConfig = (modeType) => {
    switch (modeType) {
      case 'palletBased':
        return {
          firstPalletPrice: 40,
          additionalPalletPrice: 15
        };
      case 'bulkDiscount':
        return {
          tiers: [
            { minQuantity: 1, maxQuantity: 5, pricePerPallet: 50 },
            { minQuantity: 6, pricePerPallet: 43 }
          ]
        };
      case 'fullTruck':
        return {
          minPallets: 10,
          fixedPrice: 450
        };
      case 'fixed':
        return {
          prices: {}
        };
      default:
        return {};
    }
  };

  const handleModeSelect = (modeType) => {
    setSelectedMode(modeType);
    const existingMode = modes.find(m => m.modeType === modeType);
    if (existingMode) {
      setConfig(existingMode.config || {});
    } else {
      setConfig(getDefaultConfig(modeType));
    }
  };

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTierChange = (index, field, value) => {
    setConfig(prev => {
      const newTiers = [...(prev.tiers || [])];
      newTiers[index] = {
        ...newTiers[index],
        [field]: value
      };
      return {
        ...prev,
        tiers: newTiers
      };
    });
  };

  const addTier = () => {
    setConfig(prev => ({
      ...prev,
      tiers: [
        ...(prev.tiers || []),
        { minQuantity: 1, pricePerPallet: 50 }
      ]
    }));
  };

  const removeTier = (index) => {
    setConfig(prev => ({
      ...prev,
      tiers: prev.tiers.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const response = await pricingService.savePricingMode(cityId, zoneId, {
        modeType: selectedMode,
        config: config,
        isActive: true,
        priority: 100
      });

      if (response.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        await loadPricingModes();
        if (onModeChange) {
          onModeChange(selectedMode, config);
        }
      }
    } catch (err) {
      setError('保存失败，请重试');
      console.error('Error saving pricing mode:', err);
    } finally {
      setSaving(false);
    }
  };

  const renderConfigForm = () => {
    switch (selectedMode) {
      case 'palletBased':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                首托价格
              </label>
              <input
                type="number"
                value={config.firstPalletPrice || ''}
                onChange={(e) => handleConfigChange('firstPalletPrice', parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="输入首托价格"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                续托价格
              </label>
              <input
                type="number"
                value={config.additionalPalletPrice || ''}
                onChange={(e) => handleConfigChange('additionalPalletPrice', parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="输入续托价格"
              />
            </div>
          </div>
        );

      case 'bulkDiscount':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-300">价格层级</label>
              <button
                onClick={addTier}
                className="px-3 py-1 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 text-sm"
              >
                添加层级
              </button>
            </div>
            {(config.tiers || []).map((tier, index) => (
              <div key={index} className="p-3 bg-gray-800 rounded-lg space-y-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400 mb-1">最小数量</label>
                    <input
                      type="number"
                      value={tier.minQuantity || ''}
                      onChange={(e) => handleTierChange(index, 'minQuantity', parseInt(e.target.value))}
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400 mb-1">最大数量（可选）</label>
                    <input
                      type="number"
                      value={tier.maxQuantity || ''}
                      onChange={(e) => handleTierChange(index, 'maxQuantity', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400 mb-1">单价</label>
                    <input
                      type="number"
                      value={tier.pricePerPallet || ''}
                      onChange={(e) => handleTierChange(index, 'pricePerPallet', parseFloat(e.target.value))}
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                    />
                  </div>
                  <button
                    onClick={() => removeTier(index)}
                    className="mt-5 px-2 py-1 text-red-400 hover:text-red-300"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        );

      case 'fullTruck':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                最小托盘数
              </label>
              <input
                type="number"
                value={config.minPallets || ''}
                onChange={(e) => handleConfigChange('minPallets', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                placeholder="达到此数量可用整车价"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                整车固定价格
              </label>
              <input
                type="number"
                value={config.fixedPrice || ''}
                onChange={(e) => handleConfigChange('fixedPrice', parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                placeholder="输入整车价格"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                最大托盘数（可选）
              </label>
              <input
                type="number"
                value={config.maxPallets || ''}
                onChange={(e) => handleConfigChange('maxPallets', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                placeholder="留空表示无上限"
              />
            </div>
          </div>
        );

      default:
        return <div className="text-gray-400">请选择定价模式</div>;
    }
  };

  if (loading) {
    return (
      <div className={`bg-gray-900 rounded-xl p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 rounded-xl p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2">定价模式配置</h3>
        <p className="text-gray-400 text-sm">
          为 {cityId} - {zoneId} 配置灵活的定价策略
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg flex items-center gap-2 text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="mb-4 p-3 bg-green-900/20 border border-green-800 rounded-lg flex items-center gap-2 text-green-400">
          <Check className="w-4 h-4" />
          <span className="text-sm">保存成功！</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {modeOptions.map((mode) => {
          const Icon = mode.icon;
          const isActive = mode.id === activeMode;
          const isSelected = mode.id === selectedMode;

          return (
            <button
              key={mode.id}
              onClick={() => handleModeSelect(mode.id)}
              className={`
                p-3 rounded-lg border-2 transition-all
                ${isSelected
                  ? `border-cyan-500 bg-cyan-500/10`
                  : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                }
                ${isActive ? 'ring-2 ring-green-500/30' : ''}
              `}
            >
              <Icon className={`w-6 h-6 mb-2 mx-auto text-${mode.color}-400`} />
              <div className="text-sm font-medium text-white">{mode.name}</div>
              <div className="text-xs text-gray-400 mt-1">{mode.description}</div>
              {isActive && (
                <div className="text-xs text-green-400 mt-2">当前激活</div>
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
        {renderConfigForm()}
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={loadPricingModes}
          className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
        >
          重置
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? '保存中...' : '保存配置'}
        </button>
      </div>
    </div>
  );
};

export default PricingModeSelector;