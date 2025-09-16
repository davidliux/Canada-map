/**
 * 定价规则列表组件
 * 
 * 提供定价规则的列表显示和管理功能，支持：
 * - 规则列表展示和筛选
 * - 快速编辑和删除操作
 * - 规则复制和导入导出
 * - 批量操作支持
 * 
 * Tasks 30-32: 定价规则列表功能
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  List,
  Edit3,
  Trash2,
  Copy,
  Download,
  Upload,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  Package,
  DollarSign,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Star,
  BarChart3,
  Plus
} from 'lucide-react';

import pricingService from '../../services/pricingService.js';
import { cityStorageService } from '../../utils/storage/cityStorage.js';
import { formatCurrency, formatDate } from '../../utils/formatting.js';

// 排序选项
const SORT_OPTIONS = {
  name: { label: '名称', icon: SortAsc },
  basePrice: { label: '基础价格', icon: DollarSign },
  lastModified: { label: '修改时间', icon: Calendar },
  regionCount: { label: '适用区域', icon: MapPin }
};

// 筛选选项
const FILTER_OPTIONS = {
  all: { label: '全部', count: 0 },
  active: { label: '启用中', count: 0 },
  inactive: { label: '已禁用', count: 0 },
  recent: { label: '最近修改', count: 0 }
};

/**
 * 定价规则项组件
 */
const PricingRuleItem = ({ 
  rule, 
  onEdit, 
  onDelete, 
  onCopy, 
  onToggleActive, 
  onViewDetails,
  isSelected,
  onSelect
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // 计算规则统计信息
  const ruleStats = useMemo(() => {
    if (!rule.weightRanges) return null;

    return {
      rangeCount: rule.weightRanges.length,
      minPrice: Math.min(...rule.weightRanges.map(r => r.basePrice)),
      maxPrice: Math.max(...rule.weightRanges.map(r => r.basePrice)),
      avgPerKgPrice: rule.weightRanges.reduce((sum, r) => sum + r.perKgPrice, 0) / rule.weightRanges.length
    };
  }, [rule.weightRanges]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-gray-800/50 border rounded-xl p-6 transition-all hover:border-gray-600 ${
        isSelected ? 'border-cyan-500 bg-cyan-500/10' : 'border-gray-700'
      }`}
    >
      {/* 规则头部 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(rule.id)}
            className="w-5 h-5 text-cyan-600 bg-gray-700 border-gray-600 rounded 
                     focus:ring-cyan-500 focus:ring-2"
          />
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Package className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h4 className="font-semibold text-white">{rule.name}</h4>
              <p className="text-gray-400 text-sm">
                {rule.regionNames?.join(', ') || `${rule.cityName} • ${rule.regionName}`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 状态指示 */}
          <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
            rule.isActive 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
          }`}>
            {rule.isActive ? '启用' : '禁用'}
          </div>

          {/* 操作菜单 */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10"
                  onMouseLeave={() => setShowMenu(false)}
                >
                  <button
                    onClick={() => {
                      onViewDetails(rule);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-700 first:rounded-t-lg 
                             transition-colors text-gray-300 flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    查看详情
                  </button>
                  <button
                    onClick={() => {
                      onEdit(rule);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-700 
                             transition-colors text-gray-300 flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    编辑规则
                  </button>
                  <button
                    onClick={() => {
                      onCopy(rule);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-700 
                             transition-colors text-gray-300 flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    复制规则
                  </button>
                  <button
                    onClick={() => {
                      onToggleActive(rule);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-700 
                             transition-colors text-gray-300 flex items-center gap-2"
                  >
                    {rule.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {rule.isActive ? '禁用' : '启用'}
                  </button>
                  <hr className="border-gray-700" />
                  <button
                    onClick={() => {
                      onDelete(rule);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-700 last:rounded-b-lg 
                             transition-colors text-red-400 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    删除规则
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 规则统计信息 */}
      {ruleStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-xs text-gray-400">重量范围</div>
            <div className="text-lg font-semibold text-purple-400">{ruleStats.rangeCount}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400">价格区间</div>
            <div className="text-sm font-semibold text-green-400">
              ${ruleStats.minPrice.toFixed(2)} - ${ruleStats.maxPrice.toFixed(2)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400">平均每公斤</div>
            <div className="text-sm font-semibold text-orange-400">
              ${ruleStats.avgPerKgPrice.toFixed(2)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400">最后修改</div>
            <div className="text-xs font-medium text-cyan-400">
              {formatDate(rule.lastModified)}
            </div>
          </div>
        </div>
      )}

      {/* 详细信息展开 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {rule.isPinned && (
            <Star className="w-4 h-4 text-yellow-400" />
          )}
          {rule.hasWarnings && (
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
          )}
          {rule.isValid && (
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          )}
        </div>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
        >
          <BarChart3 className="w-3 h-3" />
          {showDetails ? '隐藏详情' : '显示详情'}
        </button>
      </div>

      {/* 详细信息面板 */}
      <AnimatePresence>
        {showDetails && rule.weightRanges && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-700"
          >
            <h5 className="text-sm font-medium text-white mb-3">重量范围详情</h5>
            <div className="space-y-2">
              {rule.weightRanges.slice(0, 3).map((range, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <span className="text-sm text-gray-300">
                    {range.min}kg - {range.max === -1 ? '无上限' : `${range.max}kg`}
                  </span>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-green-400">${range.basePrice.toFixed(2)}</span>
                    <span className="text-gray-400">+</span>
                    <span className="text-orange-400">${range.perKgPrice.toFixed(2)}/kg</span>
                  </div>
                </div>
              ))}
              {rule.weightRanges.length > 3 && (
                <div className="text-center text-sm text-gray-400">
                  还有 {rule.weightRanges.length - 3} 个范围...
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * 定价规则列表主组件
 */
const PricingRuleList = ({
  cityId,
  onEdit,
  onCreateNew,
  enableBatchOperations = true,
  showFilters = true,
  className = ''
}) => {
  // 状态管理
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentFilter, setCurrentFilter] = useState('all');
  const [sortBy, setSortBy] = useState('lastModified');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedRules, setSelectedRules] = useState(new Set());
  const [showBatchMenu, setShowBatchMenu] = useState(false);

  // 加载定价规则列表
  const loadRules = useCallback(async () => {
    if (!cityId) return;

    setLoading(true);
    setError(null);
    
    try {
      console.log('加载定价规则列表:', cityId);
      const cityRules = await pricingService.getCityPricingRules(cityId);
      setRules(cityRules || []);
    } catch (err) {
      console.error('加载定价规则失败:', err);
      setError('加载定价规则失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [cityId]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  // 筛选和排序规则
  const filteredAndSortedRules = useMemo(() => {
    let filtered = rules;

    // 应用搜索筛选
    if (searchTerm.trim()) {
      filtered = filtered.filter(rule => 
        rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.cityName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.regionName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.regionNames?.some(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // 应用状态筛选
    switch (currentFilter) {
      case 'active':
        filtered = filtered.filter(rule => rule.isActive);
        break;
      case 'inactive':
        filtered = filtered.filter(rule => !rule.isActive);
        break;
      case 'recent':
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(rule => new Date(rule.lastModified) > oneWeekAgo);
        break;
    }

    // 应用排序
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'basePrice':
          const aMinPrice = Math.min(...(a.weightRanges?.map(r => r.basePrice) || [0]));
          const bMinPrice = Math.min(...(b.weightRanges?.map(r => r.basePrice) || [0]));
          comparison = aMinPrice - bMinPrice;
          break;
        case 'lastModified':
          comparison = new Date(a.lastModified) - new Date(b.lastModified);
          break;
        case 'regionCount':
          comparison = (a.regionNames?.length || 1) - (b.regionNames?.length || 1);
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [rules, searchTerm, currentFilter, sortBy, sortOrder]);

  // 计算筛选选项计数
  const filterCounts = useMemo(() => {
    return {
      all: rules.length,
      active: rules.filter(rule => rule.isActive).length,
      inactive: rules.filter(rule => !rule.isActive).length,
      recent: rules.filter(rule => {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return new Date(rule.lastModified) > oneWeekAgo;
      }).length
    };
  }, [rules]);

  // 处理规则操作
  const handleEditRule = useCallback((rule) => {
    if (onEdit) {
      onEdit(rule);
    }
  }, [onEdit]);

  const handleDeleteRule = useCallback(async (rule) => {
    if (!window.confirm(`确定要删除定价规则"${rule.name}"吗？此操作不可撤销。`)) {
      return;
    }

    try {
      await pricingService.deleteRule(rule.id);
      await loadRules(); // 重新加载列表
    } catch (error) {
      console.error('删除定价规则失败:', error);
      setError('删除定价规则失败，请重试');
    }
  }, [loadRules]);

  const handleCopyRule = useCallback(async (rule) => {
    try {
      const newRule = {
        ...rule,
        name: `${rule.name} (副本)`,
        id: undefined // 让后端生成新ID
      };
      await pricingService.createRule(newRule);
      await loadRules(); // 重新加载列表
    } catch (error) {
      console.error('复制定价规则失败:', error);
      setError('复制定价规则失败，请重试');
    }
  }, [loadRules]);

  const handleToggleActive = useCallback(async (rule) => {
    try {
      await pricingService.updateRule(rule.id, { 
        ...rule, 
        isActive: !rule.isActive 
      });
      await loadRules(); // 重新加载列表
    } catch (error) {
      console.error('更新规则状态失败:', error);
      setError('更新规则状态失败，请重试');
    }
  }, [loadRules]);

  const handleViewDetails = useCallback((rule) => {
    // 可以打开详情模态框或导航到详情页面
    console.log('查看规则详情:', rule);
  }, []);

  // 选择操作
  const handleSelectRule = useCallback((ruleId) => {
    const newSelected = new Set(selectedRules);
    if (newSelected.has(ruleId)) {
      newSelected.delete(ruleId);
    } else {
      newSelected.add(ruleId);
    }
    setSelectedRules(newSelected);
  }, [selectedRules]);

  const handleSelectAll = useCallback(() => {
    if (selectedRules.size === filteredAndSortedRules.length) {
      setSelectedRules(new Set());
    } else {
      setSelectedRules(new Set(filteredAndSortedRules.map(rule => rule.id)));
    }
  }, [selectedRules.size, filteredAndSortedRules]);

  // 批量操作
  const handleBatchOperation = useCallback(async (operation) => {
    const selectedRuleObjects = rules.filter(rule => selectedRules.has(rule.id));
    
    try {
      switch (operation) {
        case 'delete':
          if (!window.confirm(`确定要删除选中的 ${selectedRules.size} 条定价规则吗？`)) return;
          await Promise.all(selectedRuleObjects.map(rule => pricingService.deleteRule(rule.id)));
          break;
        case 'activate':
          await Promise.all(selectedRuleObjects.map(rule => 
            pricingService.updateRule(rule.id, { ...rule, isActive: true })
          ));
          break;
        case 'deactivate':
          await Promise.all(selectedRuleObjects.map(rule => 
            pricingService.updateRule(rule.id, { ...rule, isActive: false })
          ));
          break;
        case 'export':
          // 导出选中的规则
          const exportData = selectedRuleObjects.map(rule => ({
            name: rule.name,
            weightRanges: rule.weightRanges,
            cityName: rule.cityName,
            regionName: rule.regionName
          }));
          const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `pricing-rules-${new Date().toISOString().split('T')[0]}.json`;
          a.click();
          URL.revokeObjectURL(url);
          break;
      }
      
      setSelectedRules(new Set());
      setShowBatchMenu(false);
      await loadRules();
    } catch (error) {
      console.error('批量操作失败:', error);
      setError('批量操作失败，请重试');
    }
  }, [selectedRules, rules, loadRules]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 头部操作区 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/20 rounded-xl">
            <List className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              定价规则管理
            </h3>
            <p className="text-gray-300 text-sm">
              共 {rules.length} 条规则，显示 {filteredAndSortedRules.length} 条
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {enableBatchOperations && selectedRules.size > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowBatchMenu(!showBatchMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 
                         border border-orange-500 rounded-lg transition-colors text-white"
              >
                <MoreHorizontal className="w-4 h-4" />
                批量操作 ({selectedRules.size})
              </button>
              
              <AnimatePresence>
                {showBatchMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10"
                  >
                    <button
                      onClick={() => handleBatchOperation('activate')}
                      className="w-full px-4 py-3 text-left hover:bg-gray-700 first:rounded-t-lg 
                               transition-colors text-gray-300 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      批量启用
                    </button>
                    <button
                      onClick={() => handleBatchOperation('deactivate')}
                      className="w-full px-4 py-3 text-left hover:bg-gray-700 
                               transition-colors text-gray-300 flex items-center gap-2"
                    >
                      <EyeOff className="w-4 h-4" />
                      批量禁用
                    </button>
                    <button
                      onClick={() => handleBatchOperation('export')}
                      className="w-full px-4 py-3 text-left hover:bg-gray-700 
                               transition-colors text-gray-300 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      导出规则
                    </button>
                    <hr className="border-gray-700" />
                    <button
                      onClick={() => handleBatchOperation('delete')}
                      className="w-full px-4 py-3 text-left hover:bg-gray-700 last:rounded-b-lg 
                               transition-colors text-red-400 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      批量删除
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          
          {onCreateNew && (
            <button
              onClick={onCreateNew}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 
                       border border-green-500 rounded-lg transition-colors text-white"
            >
              <Plus className="w-4 h-4" />
              新建规则
            </button>
          )}
        </div>
      </div>

      {/* 搜索和筛选区 */}
      {showFilters && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 搜索框 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索规则名称、城市或区域..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg
                         text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* 筛选器 */}
            <div className="flex items-center gap-2">
              {Object.entries(FILTER_OPTIONS).map(([key, option]) => (
                <button
                  key={key}
                  onClick={() => setCurrentFilter(key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentFilter === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {option.label} ({filterCounts[key]})
                </button>
              ))}
            </div>

            {/* 排序选择 */}
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              >
                {Object.entries(SORT_OPTIONS).map(([key, option]) => (
                  <option key={key} value={key}>{option.label}</option>
                ))}
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg transition-colors text-white"
              >
                {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 批量选择 */}
          {enableBatchOperations && filteredAndSortedRules.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
              >
                <input
                  type="checkbox"
                  checked={selectedRules.size === filteredAndSortedRules.length && filteredAndSortedRules.length > 0}
                  readOnly
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded 
                           focus:ring-blue-500 focus:ring-2"
                />
                {selectedRules.size === filteredAndSortedRules.length && filteredAndSortedRules.length > 0 
                  ? '取消全选' : '全选当前页面'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 规则列表 */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-3" />
            <span className="text-gray-300">加载定价规则...</span>
          </div>
        ) : error ? (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-red-400 mb-2">加载失败</h4>
            <p className="text-red-300 mb-4">{error}</p>
            <button
              onClick={loadRules}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors text-white"
            >
              重试
            </button>
          </div>
        ) : filteredAndSortedRules.length > 0 ? (
          <AnimatePresence>
            {filteredAndSortedRules.map(rule => (
              <PricingRuleItem
                key={rule.id}
                rule={rule}
                onEdit={handleEditRule}
                onDelete={handleDeleteRule}
                onCopy={handleCopyRule}
                onToggleActive={handleToggleActive}
                onViewDetails={handleViewDetails}
                isSelected={selectedRules.has(rule.id)}
                onSelect={handleSelectRule}
              />
            ))}
          </AnimatePresence>
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-white mb-2">
              {searchTerm || currentFilter !== 'all' ? '没有找到匹配的规则' : '暂无定价规则'}
            </h4>
            <p className="text-gray-400 mb-6">
              {searchTerm || currentFilter !== 'all' 
                ? '尝试调整搜索条件或筛选器' 
                : '开始创建您的第一个定价规则'
              }
            </p>
            {onCreateNew && (!searchTerm && currentFilter === 'all') && (
              <button
                onClick={onCreateNew}
                className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg transition-colors text-white"
              >
                创建第一个规则
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingRuleList;