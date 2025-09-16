/**
 * 定价仪表板页面
 * 
 * 集成所有定价管理功能的主仪表板，提供：
 * - 综合定价概览
 * - 区域选择和地图视图
 * - 定价规则管理
 * - 批量操作界面
 * 
 * Tasks 36-39: 定价仪表板集成
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Settings,
  Map,
  List,
  Plus,
  RefreshCw,
  Download,
  Upload,
  Filter,
  Search,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Grid,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { PricingProvider, usePricing } from '../../contexts/PricingContext.jsx';
import CityRegionSelector from '../../components/pricing/CityRegionSelector.jsx';
import RegionMapView from '../../components/pricing/RegionMapView.jsx';
import EnhancedPricingRuleEditor from '../../components/pricing/EnhancedPricingRuleEditor.jsx';
import PricingRuleList from '../../components/pricing/PricingRuleList.jsx';
import BatchOperationsDialog from '../../components/pricing/BatchOperationsDialog.jsx';
import SkidPricingMatrix from '../../components/pricing/skid/SkidPricingMatrix.jsx';

/**
 * 统计卡片组件
 */
const StatCard = ({ title, value, change, icon: Icon, color = 'blue', loading = false }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 bg-${color}-500/20 rounded-xl`}>
          <Icon className={`w-6 h-6 text-${color}-400`} />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${
            change > 0 ? 'text-green-400' : change < 0 ? 'text-red-400' : 'text-gray-400'
          }`}>
            {change > 0 ? <TrendingUp className="w-4 h-4" /> : change < 0 ? <TrendingDown className="w-4 h-4" /> : null}
            {change !== 0 && `${Math.abs(change)}%`}
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-white">
          {loading ? (
            <div className="h-8 w-20 bg-gray-600 rounded animate-pulse" />
          ) : (
            value
          )}
        </h3>
        <p className="text-gray-400 text-sm">{title}</p>
      </div>
    </motion.div>
  );
};

/**
 * 视图模式切换组件
 */
const ViewModeToggle = ({ viewMode, onViewModeChange }) => {
  const modes = [
    { key: 'overview', label: '概览', icon: BarChart3 },
    { key: 'weight', label: '重量定价', icon: Package },
    { key: 'skid', label: '板数定价', icon: Grid },
    { key: 'list', label: '列表', icon: List },
    { key: 'map', label: '地图', icon: Map }
  ];

  return (
    <div className="flex items-center bg-gray-800/50 border border-gray-700 rounded-lg p-1">
      {modes.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onViewModeChange(key)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${
            viewMode === key
              ? 'bg-cyan-600 text-white shadow-lg'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
    </div>
  );
};

/**
 * 定价仪表板内容组件
 */
const PricingDashboardContent = () => {
  const {
    // 状态
    selectedCityId,
    selectedRegionId,
    selectedRegionIds,
    selectedRegions,
    currentCity,
    pricingRules,
    viewMode,
    isEditing,
    multiSelectMode,
    showBatchOperations,
    loading,
    errors,
    hasSelection,
    hasRegionSelection,
    
    // 方法
    selectCity,
    selectRegion,
    selectMultipleRegions,
    setViewMode,
    startEditing,
    stopEditing,
    toggleMultiSelect,
    toggleBatchOperations,
    clearErrors
  } = usePricing();

  // 本地状态
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [batchOperation, setBatchOperation] = useState('bulkEdit');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const navigate = useNavigate();

  // 计算统计数据
  const stats = React.useMemo(() => {
    const totalRules = pricingRules.length;
    const activeRules = pricingRules.filter(rule => rule.isActive).length;
    const totalRegions = currentCity?.regions?.length || 0;
    const configuredRegions = currentCity?.regions?.filter(region => 
      pricingRules.some(rule => rule.regionId === region.id)
    ).length || 0;

    const avgBasePrice = pricingRules.length > 0
      ? pricingRules.reduce((sum, rule) => {
          const minPrice = Math.min(...(rule.weightRanges?.map(r => r.basePrice) || [0]));
          return sum + minPrice;
        }, 0) / pricingRules.length
      : 0;

    return {
      totalRules,
      activeRules,
      totalRegions,
      configuredRegions,
      avgBasePrice,
      coveragePercent: totalRegions > 0 ? Math.round((configuredRegions / totalRegions) * 100) : 0
    };
  }, [pricingRules, currentCity]);

  // 处理城市选择
  const handleCitySelect = useCallback((cityId) => {
    selectCity(cityId);
    if (viewMode === 'editor') {
      setViewMode('overview');
    }
  }, [selectCity, viewMode, setViewMode]);

  // 处理区域选择
  const handleRegionSelect = useCallback((regionId) => {
    if (multiSelectMode) {
      const currentIds = Array.from(selectedRegionIds);
      const newIds = regionId === null ? [] : 
        currentIds.includes(regionId) 
          ? currentIds.filter(id => id !== regionId)
          : [...currentIds, regionId];
      selectMultipleRegions(newIds);
    } else {
      selectRegion(regionId);
    }
  }, [multiSelectMode, selectedRegionIds, selectMultipleRegions, selectRegion]);

  // 处理批量操作
  const handleBatchOperation = useCallback((operation, data) => {
    setBatchOperation(operation);
    setShowBatchDialog(true);
  }, []);

  // 处理编辑操作
  const handleEditRule = useCallback((rule) => {
    if (rule) {
      // 编辑现有规则
      selectRegion(rule.regionId);
      startEditing(rule.id);
    } else {
      // 创建新规则
      startEditing(null);
    }
    setViewMode('editor');
  }, [selectRegion, startEditing, setViewMode]);

  // 刷新数据
  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // 渲染概览视图
  const renderOverviewView = () => (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="总规则数"
          value={stats.totalRules}
          icon={Package}
          color="blue"
          loading={loading.rules}
        />
        <StatCard
          title="活跃规则"
          value={stats.activeRules}
          change={stats.totalRules > 0 ? ((stats.activeRules / stats.totalRules) * 100 - 50) : 0}
          icon={CheckCircle}
          color="green"
          loading={loading.rules}
        />
        <StatCard
          title="覆盖率"
          value={`${stats.coveragePercent}%`}
          change={stats.coveragePercent - 70}
          icon={BarChart3}
          color="purple"
          loading={loading.regions}
        />
        <StatCard
          title="平均基础价格"
          value={`$${stats.avgBasePrice.toFixed(2)}`}
          icon={DollarSign}
          color="orange"
          loading={loading.rules}
        />
      </div>

      {/* 快速操作 */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">快速操作</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleEditRule(null)}
            disabled={!hasSelection}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 
                     disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors text-white"
          >
            <Plus className="w-4 h-4" />
            新建规则
          </button>
          
          <button
            onClick={() => setViewMode('list')}
            disabled={!hasSelection}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 
                     disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors text-white"
          >
            <List className="w-4 h-4" />
            管理规则
          </button>
          
          <button
            onClick={() => setViewMode('map')}
            disabled={!hasSelection}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 
                     disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors text-white"
          >
            <Map className="w-4 h-4" />
            地图视图
          </button>
          
          <button
            onClick={toggleMultiSelect}
            disabled={!hasRegionSelection}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border ${
              multiSelectMode
                ? 'bg-orange-600 border-orange-500 text-white'
                : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 disabled:opacity-50'
            }`}
          >
            {multiSelectMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {multiSelectMode ? '退出多选' : '多选模式'}
          </button>
        </div>
      </div>

      {/* 最近活动 */}
      {pricingRules.length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">最近规则</h3>
          <div className="space-y-3">
            {pricingRules.slice(0, 5).map(rule => (
              <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <div>
                  <h4 className="font-medium text-white">{rule.name}</h4>
                  <p className="text-sm text-gray-400">{rule.regionName} • {rule.cityName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    rule.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {rule.isActive ? '活跃' : '禁用'}
                  </span>
                  <button
                    onClick={() => handleEditRule(rule)}
                    className="text-cyan-400 hover:text-cyan-300 text-sm"
                  >
                    编辑
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // 渲染主要内容区域
  const renderMainContent = () => {
    switch (viewMode) {
      case 'overview':
        return renderOverviewView();

      case 'weight':
        return (
          <EnhancedPricingRuleEditor
            cityId={selectedCityId}
            regionId={multiSelectMode ? null : selectedRegionId}
            regionIds={multiSelectMode ? Array.from(selectedRegionIds) : []}
            onSave={() => {
              stopEditing();
              setViewMode('list');
            }}
            onCancel={() => {
              stopEditing();
              setViewMode('list');
            }}
            showTemplates={true}
            enableBatchEdit={multiSelectMode}
          />
        );

      case 'skid':
        return (
          <SkidPricingMatrix
            cityId={selectedCityId}
            zones={currentCity?.regions || []}
            onSave={(data) => {
              console.log('保存板数定价数据:', data);
              // 这里可以添加保存逻辑
            }}
            onExport={() => {
              console.log('导出板数定价配置');
            }}
            locale="zh"
          />
        );

      case 'list':
        return (
          <PricingRuleList
            cityId={selectedCityId}
            onEdit={handleEditRule}
            onCreateNew={() => handleEditRule(null)}
            enableBatchOperations={true}
            showFilters={true}
          />
        );

      case 'map':
        return (
          <div className="h-[600px]">
            <RegionMapView
              selectedCityId={selectedCityId}
              selectedRegionIds={multiSelectMode ? Array.from(selectedRegionIds) : selectedRegionId}
              onRegionClick={handleRegionSelect}
              showPriceInfo={true}
              showRegionBoundaries={true}
              highlightColor="#00bcd4"
            />
          </div>
        );

      default:
        return renderOverviewView();
    }
  };

  return (
    <div className={`min-h-screen bg-gray-900 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* 头部 */}
      <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border-b border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/20 rounded-xl">
              <BarChart3 className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                定价管理仪表板
              </h1>
              <p className="text-gray-300 mt-1">
                {hasSelection 
                  ? `${currentCity?.name || '选中城市'} • ${selectedRegions.length > 0 ? `${selectedRegions.length} 个区域` : '未选择区域'}`
                  : '请选择城市和区域开始管理定价'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 刷新按钮 */}
            <button
              onClick={handleRefresh}
              className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg transition-colors text-gray-300"
              title="刷新数据"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            {/* 全屏切换 */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg transition-colors text-gray-300"
              title={isFullscreen ? '退出全屏' : '全屏显示'}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>

            {/* 视图模式切换 */}
            <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          </div>
        </div>

        {/* 错误提示 */}
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-400">错误提示</h4>
                <div className="mt-1 space-y-1">
                  {errors.map((error, index) => (
                    <p key={index} className="text-red-300 text-sm">{error.message}</p>
                  ))}
                </div>
              </div>
              <button
                onClick={() => clearErrors()}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* 主要内容区 */}
      <div className="flex">
        {/* 左侧边栏 */}
        <div className="w-96 border-r border-gray-700 bg-gray-800/30 p-6 overflow-y-auto">
          <CityRegionSelector
            selectedCityId={selectedCityId}
            selectedRegionId={multiSelectMode ? selectedRegionIds : selectedRegionId}
            onCitySelect={handleCitySelect}
            onRegionSelect={handleRegionSelect}
            multiSelect={multiSelectMode}
            showBatchOperations={multiSelectMode}
            onBatchOperation={handleBatchOperation}
          />
        </div>

        {/* 主内容区 */}
        <div className="flex-1 p-6 overflow-y-auto">
          {renderMainContent()}
        </div>
      </div>

      {/* 批量操作对话框 */}
      <BatchOperationsDialog
        isOpen={showBatchDialog}
        onClose={() => setShowBatchDialog(false)}
        selectedRegions={selectedRegions}
        operation={batchOperation}
        onComplete={(success) => {
          if (success) {
            handleRefresh();
          }
        }}
      />
    </div>
  );
};

/**
 * 定价仪表板页面主组件
 */
const PricingDashboard = () => {
  return (
    <PricingProvider>
      <PricingDashboardContent />
    </PricingProvider>
  );
};

export default PricingDashboard;