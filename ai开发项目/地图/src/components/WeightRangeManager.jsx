import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  AlertTriangle, 
  Weight,
  DollarSign,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { 
  formatWeightRangeLabel, 
  generateWeightRangeId, 
  sortWeightRanges,
  calculateShippingPrice 
} from '../data/fsaManagement.js';

/**
 * 重量区间管理器组件
 * 支持动态增删改重量区间和对应价格
 */
const WeightRangeManager = ({ 
  weightRanges = [], 
  onChange, 
  className = '',
  readOnly = false 
}) => {
  const [ranges, setRanges] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newRange, setNewRange] = useState({ min: '', max: '', price: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [errors, setErrors] = useState({});
  const [testWeight, setTestWeight] = useState('');

  // 同步外部数据
  useEffect(() => {
    setRanges(sortWeightRanges(weightRanges));
  }, [weightRanges]);

  /**
   * 验证重量区间数据
   */
  const validateRange = (range, excludeId = null) => {
    const errors = {};
    
    // 基本验证
    if (!range.min && range.min !== 0) {
      errors.min = '最小重量不能为空';
    } else if (isNaN(range.min) || range.min < 0) {
      errors.min = '最小重量必须是非负数字';
    }
    
    if (!range.max && range.max !== Infinity) {
      errors.max = '最大重量不能为空';
    } else if (isNaN(range.max) || range.max < 0) {
      errors.max = '最大重量必须是非负数字';
    }
    
    if (!range.price && range.price !== 0) {
      errors.price = '价格不能为空';
    } else if (isNaN(range.price) || range.price < 0) {
      errors.price = '价格必须是非负数字';
    }
    
    // 范围验证
    if (range.min >= range.max && range.max !== Infinity) {
      errors.range = '最小重量必须小于最大重量';
    }
    
    // 重叠验证
    const otherRanges = ranges.filter(r => r.id !== excludeId);
    const hasOverlap = otherRanges.some(other => {
      return (range.min < other.max && range.max > other.min);
    });
    
    if (hasOverlap) {
      errors.overlap = '重量区间与现有区间重叠';
    }
    
    return errors;
  };

  /**
   * 添加新的重量区间
   */
  const handleAddRange = () => {
    const min = parseFloat(newRange.min);
    const max = newRange.max === 'Infinity' ? Infinity : parseFloat(newRange.max);
    const price = parseFloat(newRange.price);
    
    const rangeData = { min, max, price };
    const validationErrors = validateRange(rangeData);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    const newRangeObj = {
      id: generateWeightRangeId(min, max),
      min,
      max,
      price,
      label: formatWeightRangeLabel(min, max),
      isActive: true
    };
    
    const updatedRanges = sortWeightRanges([...ranges, newRangeObj]);
    setRanges(updatedRanges);
    onChange?.(updatedRanges);
    
    // 重置表单
    setNewRange({ min: '', max: '', price: '' });
    setShowAddForm(false);
    setErrors({});
  };

  /**
   * 删除重量区间
   */
  const handleDeleteRange = (id) => {
    const updatedRanges = ranges.filter(range => range.id !== id);
    setRanges(updatedRanges);
    onChange?.(updatedRanges);
  };

  /**
   * 开始编辑重量区间
   */
  const handleEditRange = (id) => {
    setEditingId(id);
    setErrors({});
  };

  /**
   * 保存编辑的重量区间
   */
  const handleSaveRange = (id, updatedData) => {
    const validationErrors = validateRange(updatedData, id);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    const updatedRanges = ranges.map(range => 
      range.id === id 
        ? { 
            ...range, 
            ...updatedData,
            label: formatWeightRangeLabel(updatedData.min, updatedData.max)
          }
        : range
    );
    
    const sortedRanges = sortWeightRanges(updatedRanges);
    setRanges(sortedRanges);
    onChange?.(sortedRanges);
    setEditingId(null);
    setErrors({});
  };

  /**
   * 切换区间启用状态
   */
  const handleToggleActive = (id) => {
    const updatedRanges = ranges.map(range =>
      range.id === id ? { ...range, isActive: !range.isActive } : range
    );
    setRanges(updatedRanges);
    onChange?.(updatedRanges);
  };

  /**
   * 测试重量计算
   */
  const handleTestWeight = () => {
    const weight = parseFloat(testWeight);
    if (isNaN(weight) || weight < 0) return null;
    
    return calculateShippingPrice(weight, ranges);
  };

  const testPrice = testWeight ? handleTestWeight() : null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 标题和测试工具 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Weight className="w-5 h-5 text-cyber-blue" />
          <h3 className="text-lg font-semibold text-white">重量区间价格配置</h3>
        </div>
        
        {/* 价格测试工具 */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="测试重量 (KGS)"
            value={testWeight}
            onChange={(e) => setTestWeight(e.target.value)}
            className="px-3 py-1 bg-cyber-gray/50 border border-cyber-blue/30 rounded text-white text-sm w-32"
            step="0.001"
            min="0"
          />
          {testPrice !== null && (
            <div className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-green-300 text-sm">
              ${testPrice.toFixed(2)}
            </div>
          )}
        </div>
      </div>

      {/* 重量区间列表 */}
      <div className="space-y-3">
        <AnimatePresence>
          {ranges.map((range, index) => (
            <WeightRangeItem
              key={range.id}
              range={range}
              index={index}
              isEditing={editingId === range.id}
              onEdit={() => handleEditRange(range.id)}
              onSave={(data) => handleSaveRange(range.id, data)}
              onDelete={() => handleDeleteRange(range.id)}
              onToggleActive={() => handleToggleActive(range.id)}
              onCancel={() => setEditingId(null)}
              errors={errors}
              readOnly={readOnly}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* 添加新区间 */}
      {!readOnly && (
        <div className="space-y-3">
          {showAddForm ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 bg-cyber-gray/30 border border-cyber-blue/30 rounded-lg"
            >
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">最小重量 (KGS)</label>
                  <input
                    type="number"
                    value={newRange.min}
                    onChange={(e) => setNewRange({ ...newRange, min: e.target.value })}
                    className="w-full px-3 py-2 bg-cyber-gray/50 border border-cyber-blue/30 rounded text-white"
                    placeholder="0.000"
                    step="0.001"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">最大重量 (KGS)</label>
                  <input
                    type="text"
                    value={newRange.max}
                    onChange={(e) => setNewRange({ ...newRange, max: e.target.value })}
                    className="w-full px-3 py-2 bg-cyber-gray/50 border border-cyber-blue/30 rounded text-white"
                    placeholder="11.000 或 Infinity"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">价格 (CAD)</label>
                  <input
                    type="number"
                    value={newRange.price}
                    onChange={(e) => setNewRange({ ...newRange, price: e.target.value })}
                    className="w-full px-3 py-2 bg-cyber-gray/50 border border-cyber-blue/30 rounded text-white"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={handleAddRange}
                    className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded text-green-300 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewRange({ min: '', max: '', price: '' });
                      setErrors({});
                    }}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded text-red-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* 错误提示 */}
              {Object.keys(errors).length > 0 && (
                <div className="mt-3 p-3 bg-red-500/20 border border-red-500/30 rounded">
                  <div className="flex items-center gap-2 text-red-300">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">验证错误</span>
                  </div>
                  <ul className="mt-2 text-sm text-red-300 space-y-1">
                    {Object.values(errors).map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full p-4 border-2 border-dashed border-cyber-blue/30 rounded-lg text-cyber-blue hover:border-cyber-blue/50 hover:bg-cyber-blue/5 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              添加重量区间
            </button>
          )}
        </div>
      )}

      {/* 统计信息 */}
      <div className="p-4 bg-cyber-gray/20 border border-cyber-blue/20 rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-cyber-blue">{ranges.length}</div>
            <div className="text-sm text-gray-400">总区间数</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">
              {ranges.filter(r => r.isActive).length}
            </div>
            <div className="text-sm text-gray-400">启用区间</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-400">
              ${ranges.reduce((sum, r) => sum + (r.isActive ? r.price : 0), 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-400">总价格</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 重量区间项组件
 */
const WeightRangeItem = ({ 
  range, 
  index, 
  isEditing, 
  onEdit, 
  onSave, 
  onDelete, 
  onToggleActive, 
  onCancel, 
  errors,
  readOnly 
}) => {
  const [editData, setEditData] = useState({
    min: range.min,
    max: range.max === Infinity ? 'Infinity' : range.max,
    price: range.price
  });

  const handleSave = () => {
    const min = parseFloat(editData.min);
    const max = editData.max === 'Infinity' ? Infinity : parseFloat(editData.max);
    const price = parseFloat(editData.price);
    
    onSave({ min, max, price });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className={`p-4 rounded-lg border transition-all ${
        range.isActive 
          ? 'bg-cyber-gray/30 border-cyber-blue/30' 
          : 'bg-gray-800/30 border-gray-600/30'
      }`}
    >
      {isEditing ? (
        <div className="grid grid-cols-4 gap-3">
          <input
            type="number"
            value={editData.min}
            onChange={(e) => setEditData({ ...editData, min: e.target.value })}
            className="px-3 py-2 bg-cyber-gray/50 border border-cyber-blue/30 rounded text-white"
            step="0.001"
            min="0"
          />
          <input
            type="text"
            value={editData.max}
            onChange={(e) => setEditData({ ...editData, max: e.target.value })}
            className="px-3 py-2 bg-cyber-gray/50 border border-cyber-blue/30 rounded text-white"
          />
          <input
            type="number"
            value={editData.price}
            onChange={(e) => setEditData({ ...editData, price: e.target.value })}
            className="px-3 py-2 bg-cyber-gray/50 border border-cyber-blue/30 rounded text-white"
            step="0.01"
            min="0"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded text-green-300"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={onCancel}
              className="px-3 py-2 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/30 rounded text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Weight className="w-4 h-4 text-gray-400" />
              <span className={`font-medium ${range.isActive ? 'text-white' : 'text-gray-400'}`}>
                {range.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className={`font-bold ${range.isActive ? 'text-green-300' : 'text-gray-400'}`}>
                ${range.price.toFixed(2)}
              </span>
            </div>
          </div>
          
          {!readOnly && (
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleActive}
                className={`p-2 rounded transition-colors ${
                  range.isActive 
                    ? 'text-green-400 hover:bg-green-500/20' 
                    : 'text-gray-400 hover:bg-gray-500/20'
                }`}
              >
                {range.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              </button>
              <button
                onClick={onEdit}
                className="p-2 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={onDelete}
                className="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default WeightRangeManager;
