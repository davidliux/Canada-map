import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  BarChart3,
  Truck,
  Plus,
  Trash2,
  Calculator,
  Save,
  X
} from 'lucide-react';

const PricingModePanel = ({
  selection,
  currentConfig,
  onSave,
  onCancel,
  className = ''
}) => {
  const [selectedMode, setSelectedMode] = useState(currentConfig?.mode || 'fixed');
  const [config, setConfig] = useState(currentConfig?.config || getDefaultConfig('fixed'));
  const [previewSkidCount, setPreviewSkidCount] = useState(10);
  const [isSaving, setIsSaving] = useState(false);

  // 获取默认配置
  function getDefaultConfig(mode) {
    switch (mode) {
      case 'fixed':
        return { type: 'fixed', pricePerSkid: 15 };
      case 'progressive':
        return {
          type: 'progressive',
          firstSkidPrice: 20,
          additionalSkidPrice: 15,
          firstSkidCount: 1
        };
      case 'tiered':
        return {
          type: 'tiered',
          tiers: [
            { id: '1', minQuantity: 1, maxQuantity: 4, pricePerSkid: 20 },
            { id: '2', minQuantity: 5, maxQuantity: 8, pricePerSkid: 18 },
            { id: '3', minQuantity: 9, maxQuantity: 12, pricePerSkid: 16 },
            { id: '4', minQuantity: 13, maxQuantity: 16, pricePerSkid: 14 },
            { id: '5', minQuantity: 17, maxQuantity: null, pricePerSkid: 12 }
          ]
        };
      case 'truckload':
        return {
          type: 'truckload',
          minSkidsForTruckload: 20,
          truckloadPrice: 200,
          belowTruckloadMode: 'fixed',
          belowTruckloadConfig: { type: 'fixed', pricePerSkid: 15 }
        };
      default:
        return { type: 'fixed', pricePerSkid: 15 };
    }
  }

  // 定价模式选项
  const pricingModes = [
    {
      id: 'fixed',
      name: '固定价格',
      description: '每板统一价',
      icon: DollarSign,
      color: 'blue'
    },
    {
      id: 'progressive',
      name: '首续托定价',
      description: '差异化定价',
      icon: TrendingUp,
      color: 'green'
    },
    {
      id: 'tiered',
      name: '阶梯定价',
      description: '数量折扣',
      icon: BarChart3,
      color: 'purple'
    },
    {
      id: 'truckload',
      name: '整车定价',
      description: '批量优惠',
      icon: Truck,
      color: 'orange'
    }
  ];

  // 切换定价模式
  const handleModeChange = (mode) => {
    setSelectedMode(mode);
    setConfig(getDefaultConfig(mode));
  };

  // 更新配置
  const handleConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 添加阶梯
  const addTier = () => {
    if (config.type !== 'tiered') return;

    const lastTier = config.tiers[config.tiers.length - 1];
    const newTier = {
      id: Date.now().toString(),
      minQuantity: lastTier.maxQuantity ? lastTier.maxQuantity + 1 : 1,
      maxQuantity: null,
      pricePerSkid: lastTier.pricePerSkid * 0.9
    };

    // 更新前一个阶梯的最大值
    const updatedTiers = config.tiers.map((tier, index) =>
      index === config.tiers.length - 1
        ? { ...tier, maxQuantity: newTier.minQuantity - 1 }
        : tier
    );

    setConfig(prev => ({
      ...prev,
      tiers: [...updatedTiers, newTier]
    }));
  };

  // 删除阶梯
  const removeTier = (tierId) => {
    if (config.type !== 'tiered' || config.tiers.length <= 1) return;

    setConfig(prev => ({
      ...prev,
      tiers: prev.tiers.filter(tier => tier.id !== tierId)
    }));
  };

  // 更新阶梯
  const updateTier = (tierId, field, value) => {
    if (config.type !== 'tiered') return;

    setConfig(prev => ({
      ...prev,
      tiers: prev.tiers.map(tier =>
        tier.id === tierId ? { ...tier, [field]: value } : tier
      )
    }));
  };

  // 计算预览价格
  const calculatePreviewPrice = () => {
    switch (config.type) {
      case 'fixed':
        return config.pricePerSkid * previewSkidCount;

      case 'progressive':
        if (previewSkidCount <= config.firstSkidCount) {
          return config.firstSkidPrice * previewSkidCount;
        }
        const firstPart = config.firstSkidPrice * config.firstSkidCount;
        const additionalPart = config.additionalSkidPrice * (previewSkidCount - config.firstSkidCount);
        return firstPart + additionalPart;

      case 'tiered':
        const tier = config.tiers.find(t =>
          previewSkidCount >= t.minQuantity &&
          (t.maxQuantity === null || previewSkidCount <= t.maxQuantity)
        );
        return tier ? tier.pricePerSkid * previewSkidCount : 0;

      case 'truckload':
        if (previewSkidCount >= config.minSkidsForTruckload) {
          return config.truckloadPrice;
        }
        // 递归计算低于整车数量的价格
        const tempConfig = { ...config, ...config.belowTruckloadConfig };
        return calculatePriceWithConfig(tempConfig, previewSkidCount);

      default:
        return 0;
    }
  };

  // 辅助函数：根据配置计算价格
  const calculatePriceWithConfig = (cfg, count) => {
    if (cfg.type === 'fixed') {
      return cfg.pricePerSkid * count;
    }
    // 其他模式的计算...
    return 0;
  };

  // 保存配置
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        mode: selectedMode,
        config: config,
        selection: selection
      });
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // 渲染固定价格配置
  const renderFixedPricing = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          单价设置 ($/板)
        </label>
        <input
          type="number"
          value={config.pricePerSkid || 0}
          onChange={(e) => handleConfigChange('pricePerSkid', parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
          min="0"
          step="0.01"
        />
      </div>
    </div>
  );

  // 渲染首续托定价配置
  const renderProgressivePricing = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            首托板数
          </label>
          <input
            type="number"
            value={config.firstSkidCount || 1}
            onChange={(e) => handleConfigChange('firstSkidCount', parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            min="1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            首托价格 ($/板)
          </label>
          <input
            type="number"
            value={config.firstSkidPrice || 0}
            onChange={(e) => handleConfigChange('firstSkidPrice', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            min="0"
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            续托价格 ($/板)
          </label>
          <input
            type="number"
            value={config.additionalSkidPrice || 0}
            onChange={(e) => handleConfigChange('additionalSkidPrice', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            min="0"
            step="0.01"
          />
        </div>
      </div>
    </div>
  );

  // 渲染阶梯定价配置
  const renderTieredPricing = () => (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-4">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-400">
              <th className="pb-2">板数范围</th>
              <th className="pb-2">单价 ($/板)</th>
              <th className="pb-2 w-10"></th>
            </tr>
          </thead>
          <tbody className="space-y-2">
            {config.tiers.map((tier, index) => (
              <tr key={tier.id} className="border-t border-gray-700">
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={tier.minQuantity}
                      onChange={(e) => updateTier(tier.id, 'minQuantity', parseInt(e.target.value))}
                      className="w-16 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                      min="1"
                    />
                    <span className="text-gray-400">-</span>
                    {tier.maxQuantity !== null ? (
                      <input
                        type="number"
                        value={tier.maxQuantity}
                        onChange={(e) => updateTier(tier.id, 'maxQuantity', parseInt(e.target.value))}
                        className="w-16 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                        min={tier.minQuantity}
                      />
                    ) : (
                      <span className="text-gray-400 text-sm">以上</span>
                    )}
                    <span className="text-gray-500 text-sm">板</span>
                  </div>
                </td>
                <td className="py-2">
                  <input
                    type="number"
                    value={tier.pricePerSkid}
                    onChange={(e) => updateTier(tier.id, 'pricePerSkid', parseFloat(e.target.value))}
                    className="w-24 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                    min="0"
                    step="0.01"
                  />
                </td>
                <td className="py-2">
                  {config.tiers.length > 1 && (
                    <button
                      onClick={() => removeTier(tier.id)}
                      className="p-1 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          onClick={addTier}
          className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white"
        >
          <Plus className="w-4 h-4" />
          添加阶梯
        </button>
      </div>
    </div>
  );

  // 渲染整车定价配置
  const renderTruckloadPricing = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            整车起始板数
          </label>
          <input
            type="number"
            value={config.minSkidsForTruckload || 20}
            onChange={(e) => handleConfigChange('minSkidsForTruckload', parseInt(e.target.value) || 20)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            min="1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            整车价格 ($)
          </label>
          <input
            type="number"
            value={config.truckloadPrice || 200}
            onChange={(e) => handleConfigChange('truckloadPrice', parseFloat(e.target.value) || 200)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div className="border-t border-gray-700 pt-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          低于整车数量时的定价方式
        </label>
        <select
          value={config.belowTruckloadMode}
          onChange={(e) => handleConfigChange('belowTruckloadMode', e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
        >
          <option value="fixed">固定价格</option>
          <option value="progressive">首续托定价</option>
          <option value="tiered">阶梯定价</option>
        </select>
      </div>
    </div>
  );

  // 渲染配置表单
  const renderConfigForm = () => {
    switch (selectedMode) {
      case 'fixed':
        return renderFixedPricing();
      case 'progressive':
        return renderProgressivePricing();
      case 'tiered':
        return renderTieredPricing();
      case 'truckload':
        return renderTruckloadPricing();
      default:
        return null;
    }
  };

  return (
    <div className={`pricing-mode-panel bg-gray-900 rounded-xl p-6 ${className}`}>
      {/* 标题 */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2">定价模式配置</h3>
        <p className="text-sm text-gray-400">
          为选中的{selection?.selectionLevel === 'group' ? '分组' : selection?.selectionLevel === 'zone' ? '区域' : '城市'}配置定价策略
        </p>
      </div>

      {/* 模式选择器 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">选择定价模式</label>
        <div className="grid grid-cols-4 gap-3">
          {pricingModes.map(mode => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                className={`
                  p-4 rounded-lg border-2 transition-all
                  ${isSelected
                    ? `bg-${mode.color}-600/20 border-${mode.color}-500`
                    : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                  }
                `}
              >
                <Icon className={`w-6 h-6 mb-2 ${isSelected ? `text-${mode.color}-500` : 'text-gray-400'}`} />
                <div className="text-sm font-medium text-white">{mode.name}</div>
                <div className="text-xs text-gray-400 mt-1">{mode.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 配置表单 */}
      <div className="mb-6">
        {renderConfigForm()}
      </div>

      {/* 价格预览 */}
      <div className="mb-6 p-4 bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-white flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            价格预览
          </h4>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">板数:</label>
            <input
              type="number"
              value={previewSkidCount}
              onChange={(e) => setPreviewSkidCount(parseInt(e.target.value) || 0)}
              className="w-20 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm"
              min="1"
            />
          </div>

          <div className="flex-1 text-right">
            <span className="text-sm text-gray-400">总价: </span>
            <span className="text-xl font-bold text-green-400">
              ${calculatePreviewPrice().toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          取消
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? '保存中...' : '保存配置'}
        </button>
      </div>
    </div>
  );
};

export default PricingModePanel;