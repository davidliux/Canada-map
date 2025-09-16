/**
 * 自定义价格规则配置面板
 *
 * 提供板数定价的自定义规则配置功能
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sliders,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle,
  Calculator,
  Percent,
  DollarSign,
  Package,
  TrendingUp,
  Copy,
  Edit3,
  Info
} from 'lucide-react';
import pricingService from '../../../services/pricingService';

// 规则类型选项
const RULE_TYPES = {
  BASE: { label: '基础价格', icon: DollarSign, color: 'blue' },
  INCREMENTAL: { label: '递增价格', icon: TrendingUp, color: 'green' },
  PERCENTAGE: { label: '百分比加价', icon: Percent, color: 'purple' },
  FIXED: { label: '固定加价', icon: Calculator, color: 'orange' }
};

// 条件类型选项
const CONDITION_TYPES = {
  SKID_RANGE: { label: '板数范围', icon: Package },
  TOTAL_WEIGHT: { label: '总重量', icon: Package },
  TIME_OF_DAY: { label: '时间段', icon: Package },
  RUSH_ORDER: { label: '加急订单', icon: Package }
};

/**
 * 规则编辑器组件
 */
const RuleEditor = ({ rule, onUpdate, onDelete, index }) => {
  const [isEditing, setIsEditing] = useState(!rule.id);
  const [editData, setEditData] = useState(rule);

  const handleSave = () => {
    onUpdate(index, editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(rule);
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gray-800/50 border border-gray-700 rounded-lg p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-${RULE_TYPES[rule.type]?.color || 'gray'}-500/20`}>
            {React.createElement(RULE_TYPES[rule.type]?.icon || Sliders, {
              className: `w-4 h-4 text-${RULE_TYPES[rule.type]?.color || 'gray'}-400`
            })}
          </div>
          {isEditing ? (
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-white
                       focus:border-cyan-500 focus:outline-none"
              placeholder="规则名称"
            />
          ) : (
            <h4 className="text-white font-medium">{rule.name}</h4>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancel}
                className="p-2 text-gray-400 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <AlertCircle className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-gray-400 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(index)}
                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          {/* 规则类型 */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">规则类型</label>
            <select
              value={editData.type}
              onChange={(e) => setEditData({ ...editData, type: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
                       text-white focus:border-cyan-500 focus:outline-none"
            >
              {Object.entries(RULE_TYPES).map(([key, type]) => (
                <option key={key} value={key}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* 条件配置 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">条件类型</label>
              <select
                value={editData.condition?.type || 'SKID_RANGE'}
                onChange={(e) => setEditData({
                  ...editData,
                  condition: { ...editData.condition, type: e.target.value }
                })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
                         text-white focus:border-cyan-500 focus:outline-none"
              >
                {Object.entries(CONDITION_TYPES).map(([key, type]) => (
                  <option key={key} value={key}>{type.label}</option>
                ))}
              </select>
            </div>

            {editData.condition?.type === 'SKID_RANGE' && (
              <>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">最小板数</label>
                  <input
                    type="number"
                    value={editData.condition?.minSkids || 1}
                    onChange={(e) => setEditData({
                      ...editData,
                      condition: { ...editData.condition, minSkids: parseInt(e.target.value) }
                    })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
                             text-white focus:border-cyan-500 focus:outline-none"
                    min="1"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">最大板数</label>
                  <input
                    type="number"
                    value={editData.condition?.maxSkids || ''}
                    onChange={(e) => setEditData({
                      ...editData,
                      condition: { ...editData.condition, maxSkids: e.target.value ? parseInt(e.target.value) : null }
                    })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
                             text-white focus:border-cyan-500 focus:outline-none"
                    placeholder="不限"
                  />
                </div>
              </>
            )}
          </div>

          {/* 价格配置 */}
          <div className="grid grid-cols-2 gap-3">
            {editData.type === 'BASE' && (
              <div>
                <label className="text-sm text-gray-400 mb-1 block">基础价格</label>
                <input
                  type="number"
                  value={editData.value || 0}
                  onChange={(e) => setEditData({ ...editData, value: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
                           text-white focus:border-cyan-500 focus:outline-none"
                  step="0.01"
                  min="0"
                />
              </div>
            )}
            {editData.type === 'INCREMENTAL' && (
              <>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">每板增加</label>
                  <input
                    type="number"
                    value={editData.incrementValue || 0}
                    onChange={(e) => setEditData({ ...editData, incrementValue: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
                             text-white focus:border-cyan-500 focus:outline-none"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">起始板数</label>
                  <input
                    type="number"
                    value={editData.startFrom || 1}
                    onChange={(e) => setEditData({ ...editData, startFrom: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
                             text-white focus:border-cyan-500 focus:outline-none"
                    min="1"
                  />
                </div>
              </>
            )}
            {editData.type === 'PERCENTAGE' && (
              <div>
                <label className="text-sm text-gray-400 mb-1 block">加价百分比 (%)</label>
                <input
                  type="number"
                  value={editData.percentage || 0}
                  onChange={(e) => setEditData({ ...editData, percentage: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
                           text-white focus:border-cyan-500 focus:outline-none"
                  step="0.1"
                  min="0"
                />
              </div>
            )}
            {editData.type === 'FIXED' && (
              <div>
                <label className="text-sm text-gray-400 mb-1 block">固定加价</label>
                <input
                  type="number"
                  value={editData.fixedAmount || 0}
                  onChange={(e) => setEditData({ ...editData, fixedAmount: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
                           text-white focus:border-cyan-500 focus:outline-none"
                  step="0.01"
                  min="0"
                />
              </div>
            )}
          </div>

          {/* 优先级 */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">优先级（数字越小优先级越高）</label>
            <input
              type="number"
              value={editData.priority || 100}
              onChange={(e) => setEditData({ ...editData, priority: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
                       text-white focus:border-cyan-500 focus:outline-none"
              min="1"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">类型:</span>
            <span className="text-white">{RULE_TYPES[rule.type]?.label}</span>
          </div>
          {rule.condition?.type === 'SKID_RANGE' && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400">板数范围:</span>
              <span className="text-white">
                {rule.condition.minSkids} - {rule.condition.maxSkids || '不限'}
              </span>
            </div>
          )}
          {rule.type === 'BASE' && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400">基础价格:</span>
              <span className="text-green-400">${rule.value?.toFixed(2)}</span>
            </div>
          )}
          {rule.type === 'INCREMENTAL' && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400">递增价格:</span>
              <span className="text-green-400">
                每板 +${rule.incrementValue?.toFixed(2)} (从第{rule.startFrom}板开始)
              </span>
            </div>
          )}
          {rule.type === 'PERCENTAGE' && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400">百分比加价:</span>
              <span className="text-green-400">+{rule.percentage}%</span>
            </div>
          )}
          {rule.type === 'FIXED' && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400">固定加价:</span>
              <span className="text-green-400">+${rule.fixedAmount?.toFixed(2)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-gray-400">优先级:</span>
            <span className="text-white">{rule.priority || 100}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

/**
 * 价格预览组件
 */
const PricePreview = ({ rules, maxSkids = 20 }) => {
  const calculatePrice = (skidCount) => {
    let price = 0;
    const applicableRules = rules
      .filter(rule => {
        if (rule.condition?.type === 'SKID_RANGE') {
          const min = rule.condition.minSkids || 1;
          const max = rule.condition.maxSkids || Infinity;
          return skidCount >= min && skidCount <= max;
        }
        return true;
      })
      .sort((a, b) => (a.priority || 100) - (b.priority || 100));

    applicableRules.forEach(rule => {
      switch (rule.type) {
        case 'BASE':
          price = rule.value || 0;
          break;
        case 'INCREMENTAL':
          if (skidCount >= (rule.startFrom || 1)) {
            price += (skidCount - (rule.startFrom || 1) + 1) * (rule.incrementValue || 0);
          }
          break;
        case 'PERCENTAGE':
          price *= (1 + (rule.percentage || 0) / 100);
          break;
        case 'FIXED':
          price += rule.fixedAmount || 0;
          break;
      }
    });

    return price;
  };

  const previewData = Array.from({ length: Math.min(maxSkids, 16) }, (_, i) => ({
    skids: i + 1,
    price: calculatePrice(i + 1)
  }));

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
      <h4 className="text-white font-medium mb-3 flex items-center gap-2">
        <Calculator className="w-4 h-4 text-cyan-400" />
        价格预览
      </h4>
      <div className="grid grid-cols-4 gap-2">
        {previewData.map(({ skids, price }) => (
          <div key={skids} className="bg-gray-700/50 rounded-lg p-2 text-center">
            <div className="text-xs text-gray-400">{skids}板</div>
            <div className="text-sm font-semibold text-green-400">
              ${price.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 自定义价格配置面板主组件
 */
const CustomPricingPanel = ({ cityId, zone, onSave, onChange }) => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(null);

  // 加载现有规则
  useEffect(() => {
    loadRules();
  }, [cityId, zone?.id]);

  const loadRules = async () => {
    try {
      setLoading(true);
      // 这里应该从服务获取规则，现在先用模拟数据
      const mockRules = [
        {
          id: '1',
          name: '基础价格（1-2板）',
          type: 'BASE',
          condition: { type: 'SKID_RANGE', minSkids: 1, maxSkids: 2 },
          value: 150,
          priority: 1
        },
        {
          id: '2',
          name: '递增价格（3板起）',
          type: 'INCREMENTAL',
          condition: { type: 'SKID_RANGE', minSkids: 3, maxSkids: null },
          incrementValue: 25,
          startFrom: 3,
          priority: 2
        }
      ];
      setRules(mockRules);
    } catch (error) {
      console.error('加载规则失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 添加新规则
  const handleAddRule = () => {
    const newRule = {
      id: null,
      name: `新规则 ${rules.length + 1}`,
      type: 'BASE',
      condition: { type: 'SKID_RANGE', minSkids: 1, maxSkids: null },
      value: 0,
      priority: (rules.length + 1) * 10
    };
    setRules([...rules, newRule]);
  };

  // 更新规则
  const handleUpdateRule = (index, updatedRule) => {
    const newRules = [...rules];
    newRules[index] = updatedRule;
    setRules(newRules);
    if (onChange) {
      onChange({ customRules: newRules });
    }
  };

  // 删除规则
  const handleDeleteRule = (index) => {
    const newRules = rules.filter((_, i) => i !== index);
    setRules(newRules);
    if (onChange) {
      onChange({ customRules: newRules });
    }
  };

  // 保存规则
  const handleSaveRules = async () => {
    try {
      setSaveStatus('saving');
      // 这里应该调用服务保存规则
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟保存
      if (onSave) {
        onSave({ customRules: rules });
      }
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error('保存规则失败:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 标题栏 */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-850 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <Sliders className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">自定义价格规则</h3>
              <p className="text-xs text-gray-400 mt-1">
                为 {zone?.name || '区域'} 配置灵活的定价规则
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleAddRule}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg
                       transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              添加规则
            </button>
            <button
              onClick={handleSaveRules}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg
                       transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              保存配置
            </button>
          </div>
        </div>

        {/* 帮助提示 */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-300">
            <p>规则按优先级顺序执行，数字越小优先级越高。</p>
            <p>您可以组合不同类型的规则来实现复杂的定价策略。</p>
          </div>
        </div>
      </div>

      {/* 规则列表 */}
      <div className="space-y-4">
        <AnimatePresence>
          {rules.map((rule, index) => (
            <RuleEditor
              key={rule.id || `new-${index}`}
              rule={rule}
              index={index}
              onUpdate={handleUpdateRule}
              onDelete={handleDeleteRule}
            />
          ))}
        </AnimatePresence>

        {rules.length === 0 && (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">暂无定价规则</p>
            <p className="text-gray-500 text-sm mt-1">点击"添加规则"开始配置</p>
          </div>
        )}
      </div>

      {/* 价格预览 */}
      {rules.length > 0 && (
        <PricePreview rules={rules} />
      )}

      {/* 保存状态提示 */}
      <AnimatePresence>
        {saveStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg
              ${saveStatus === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                saveStatus === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'}`}
          >
            <div className="flex items-center gap-2">
              {saveStatus === 'success' && <CheckCircle className="w-4 h-4" />}
              {saveStatus === 'error' && <AlertCircle className="w-4 h-4" />}
              {saveStatus === 'saving' && (
                <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              )}
              <span className="text-sm">
                {saveStatus === 'success' && '规则已保存'}
                {saveStatus === 'error' && '保存失败'}
                {saveStatus === 'saving' && '保存中...'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomPricingPanel;