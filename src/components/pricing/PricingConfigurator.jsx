import React, { useState, useEffect } from 'react';
import {
  Package,
  TrendingUp,
  Truck,
  Layers,
  Save,
  AlertCircle,
  Check,
  Clipboard,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import pricingServiceV2 from '../../services/pricingServiceV2';

const PricingConfigurator = ({ selectedTargets = [] }) => {
  const [selectedMode, setSelectedMode] = useState('skid');
  const [pricingData, setPricingData] = useState({});
  const [saving, setSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPasteDialog, setShowPasteDialog] = useState(false);
  const [pasteData, setPasteData] = useState('');

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
    // 当选择的定价模式改变时，重置定价数据
    setPricingData(getDefaultPricingData(selectedMode));
  }, [selectedMode]);

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

  const handlePasteData = () => {
    if (!pasteData.trim()) {
      alert('请粘贴价格数据');
      return;
    }

    try {
      const lines = pasteData.trim().split('\n');
      const prices = {};

      // 检查是否是"板数 价格"格式（如 "1 skid    108"）
      const isSkidFormat = lines.some(line => {
        const cleanLine = line.toLowerCase().trim();
        return cleanLine.includes('skid') || cleanLine.match(/^\d+\+?\s+(skids?|板)/);
      });

      if (isSkidFormat) {
        // 处理 "1 skid    108" 格式
        lines.forEach((line, index) => {
          // 提取价格（最后一个数字）
          const matches = line.match(/(\d+(?:\.\d+)?)\s*$/);
          if (matches) {
            const price = parseFloat(matches[1]);
            if (!isNaN(price) && price >= 0) {
              // 确定板数key
              const key = index === 16 ? '16+' : String(index + 1);
              prices[key] = price;
            }
          }
        });
      } else {
        // 处理纯数字格式，每行一个价格
        lines.forEach((line, index) => {
          const price = parseFloat(line.trim().replace(/[$,]/g, ''));
          if (!isNaN(price) && price >= 0) {
            const key = index === 16 ? '16+' : String(index + 1);
            prices[key] = price;
          }
        });
      }

      if (Object.keys(prices).length > 0) {
        setPricingData(prev => ({
          ...prev,
          prices: {
            ...prev.prices,
            ...prices
          }
        }));
        setShowPasteDialog(false);
        setPasteData('');
        alert(`成功导入 ${Object.keys(prices).length} 个价格`);
      } else {
        alert('未找到有效的价格数据');
      }
    } catch (error) {
      console.error('解析粘贴数据失败:', error);
      alert('解析数据失败，请检查格式');
    }
  };

  const handleSaveConfig = async () => {
    if (selectedTargets.length === 0) {
      setErrorMessage('请至少选择一个城市、区域或分组');
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }

    setSaving(true);
    const configs = [];

    // 为每个选中的目标创建配置
    for (const target of selectedTargets) {
      const config = {
        city_id: target.cityId,
        level: target.type,
        pricing_mode: selectedMode,
        pricing_data: {
          mode: selectedMode,
          ...pricingData
        },
        is_active: true,
        name: `${target.name} - ${modeOptions.find(m => m.id === selectedMode)?.name}`,
        priority: target.level
      };

      if (target.type === 'zone') {
        config.zone_id = target.id;
      } else if (target.type === 'group') {
        config.group_id = target.id;
      }

      configs.push(config);
    }

    // 批量保存配置
    let successCount = 0;
    let failedConfigs = [];

    for (const config of configs) {
      try {
        const response = await pricingServiceV2.saveConfig(config);
        if (response.success) {
          successCount++;
        } else {
          failedConfigs.push(config.name);
        }
      } catch (error) {
        console.error('Failed to save config:', error);
        failedConfigs.push(config.name);
      }
    }

    setSaving(false);

    if (successCount > 0) {
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }

    if (failedConfigs.length > 0) {
      setErrorMessage(`部分配置保存失败: ${failedConfigs.join(', ')}`);
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    }
  };

  const renderPricingForm = () => {
    switch (selectedMode) {
      case 'skid':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-white font-medium">板数价格配置</h4>
              <button
                onClick={() => setShowPasteDialog(true)}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md
                         transition-colors text-sm flex items-center gap-2"
                title="从Excel粘贴价格"
              >
                <Clipboard className="w-4 h-4" />
                <span>粘贴价格</span>
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[...Array(16)].map((_, i) => {
                const key = i === 15 ? '16+' : String(i + 1);
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm w-10 text-right">{key}板:</span>
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
                      className="flex-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:border-cyan-500 focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'first_cont':
        return (
          <div className="space-y-4">
            <h4 className="text-white font-medium">首续托价格配置</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">首托价格</label>
                <input
                  type="number"
                  value={pricingData.first_skid || ''}
                  onChange={(e) => setPricingData(prev => ({ ...prev, first_skid: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">续托价格</label>
                <input
                  type="number"
                  value={pricingData.cont_skid || ''}
                  onChange={(e) => setPricingData(prev => ({ ...prev, cont_skid: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">最大板数</label>
                <input
                  type="number"
                  value={pricingData.max_skids || ''}
                  onChange={(e) => setPricingData(prev => ({ ...prev, max_skids: parseInt(e.target.value) || 16 }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="16"
                />
              </div>
            </div>
          </div>
        );

      case 'per_skid':
        return (
          <div className="space-y-4">
            <h4 className="text-white font-medium">每板单价配置</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">每板价格</label>
                <input
                  type="number"
                  value={pricingData.price_per_skid || ''}
                  onChange={(e) => setPricingData(prev => ({ ...prev, price_per_skid: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">最小板数</label>
                <input
                  type="number"
                  value={pricingData.min_skids || ''}
                  onChange={(e) => setPricingData(prev => ({ ...prev, min_skids: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="1"
                />
              </div>
            </div>
          </div>
        );

      case 'full_truck':
        return (
          <div className="space-y-4">
            <h4 className="text-white font-medium">整车定价配置</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">整车价格</label>
                <input
                  type="number"
                  value={pricingData.truck_price || ''}
                  onChange={(e) => setPricingData(prev => ({ ...prev, truck_price: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">最大板数</label>
                <input
                  type="number"
                  value={pricingData.max_skids || ''}
                  onChange={(e) => setPricingData(prev => ({ ...prev, max_skids: parseInt(e.target.value) || 16 }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="16"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl p-6">
      {/* 消息提示 */}
      <AnimatePresence>
        {showSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 p-3 bg-green-900/20 border border-green-800 rounded-lg flex items-center gap-2"
          >
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-sm">配置保存成功！</span>
          </motion.div>
        )}

        {showError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-sm">{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-6">
        <h3 className="text-lg font-bold text-white">定价模式</h3>
        <p className="text-gray-400 text-sm mt-1">
          选择定价模式并配置价格参数
        </p>
      </div>

      {/* 定价模式选择 */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {modeOptions.map(mode => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;

          return (
            <button
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              className={`p-3 rounded-lg border-2 transition-all ${
                isSelected
                  ? `border-${mode.color}-500 bg-${mode.color}-500/10`
                  : 'border-gray-700 bg-gray-800 hover:border-gray-600'
              }`}
            >
              <Icon className={`w-6 h-6 mb-2 mx-auto text-${mode.color}-400`} />
              <div className="text-sm font-medium text-white">{mode.name}</div>
              <div className="text-xs text-gray-400 mt-1">{mode.description}</div>
            </button>
          );
        })}
      </div>

      {/* 定价配置表单 */}
      <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
        {renderPricingForm()}
      </div>

      {/* 保存按钮 */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveConfig}
          disabled={saving || selectedTargets.length === 0}
          className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-all ${
            selectedTargets.length === 0
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700'
          } ${saving ? 'opacity-50 cursor-wait' : ''}`}
        >
          <Save className="w-4 h-4" />
          {saving ? '保存中...' : '保存配置'}
        </button>
      </div>

      {/* 粘贴价格对话框 */}
      <AnimatePresence>
        {showPasteDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowPasteDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900 rounded-lg p-6 w-[600px] max-w-[90vw] border border-gray-700"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center space-x-2 mb-4">
                <FileSpreadsheet className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-semibold text-white">粘贴价格数据</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    粘贴价格数据（支持多种格式）
                  </label>
                  <textarea
                    value={pasteData}
                    onChange={(e) => setPasteData(e.target.value)}
                    onPaste={(e) => {
                      e.preventDefault();
                      const text = e.clipboardData.getData('text');
                      setPasteData(text);
                    }}
                    className="w-full h-48 px-3 py-2 bg-gray-800 border border-gray-600
                             rounded-md text-white placeholder-gray-400 font-mono text-sm
                             focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder={`从Excel复制价格数据后粘贴到这里...

支持的格式：
• 板数+价格格式：带板数描述的价格列表
• 纯数字格式：每行一个价格

示例1（板数+价格格式）：
1 skid    108
2 skids   130.5
3 skids   153
...

示例2（纯数字格式）：
108
130.5
153
...`}
                  />
                </div>

                <div className="bg-gray-800 rounded-lg p-3 border border-gray-600">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-300 space-y-1">
                      <p className="font-medium text-yellow-400">使用说明：</p>
                      <ul className="space-y-1 text-gray-400">
                        <li>• 支持直接粘贴您提供的板数价格格式</li>
                        <li>• 系统会自动识别并提取价格数字</li>
                        <li>• 按顺序应用到1-16+板的价格</li>
                        <li>• 支持包含货币符号的数据（会自动清理）</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {pasteData && (
                  <div className="text-sm text-gray-400">
                    检测到 {pasteData.trim().split('\n').length} 行数据
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setPasteData('');
                    setShowPasteDialog(false);
                  }}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handlePasteData}
                  disabled={!pasteData.trim()}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600
                           text-white rounded-md transition-colors flex items-center space-x-2"
                >
                  <Clipboard className="w-4 h-4" />
                  <span>导入价格</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PricingConfigurator;