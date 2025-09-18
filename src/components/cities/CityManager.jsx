import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Edit3,
  Trash2,
  MapPin,
  Building2,
  Map,
  Users,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Palette
} from 'lucide-react';

import AnimatedSearchBox from '../AnimatedSearchBox';
import CityEditDialog from './CityEditDialog';
import cityDatabaseService from '../../utils/storage/cityDatabaseService';
import { dataUpdateNotifier } from '../../utils/dataUpdateNotifier';

/**
 * 城市管理组件
 * 
 * 功能特性：
 * - 城市列表展示（带主题色指示器）
 * - 搜索过滤功能
 * - 添加/编辑/删除城市
 * - 实时数据同步
 * - Framer Motion 动画效果
 */
const CityManager = () => {
  // === 状态管理 ===
  const [cities, setCities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmCity, setDeleteConfirmCity] = useState(null);
  const [error, setError] = useState(null);

  // === 数据获取 ===
  const loadCities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const citiesData = await cityDatabaseService.getAllCities();
      setCities(citiesData);
      
      console.log(`📦 加载了 ${citiesData.length} 个城市`);
    } catch (err) {
      console.error('加载城市列表失败:', err);
      setError('加载城市列表失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // === 初始化和数据更新监听 ===
  useEffect(() => {
    loadCities();

    // 订阅数据更新事件
    const unsubscribe = dataUpdateNotifier.subscribe((updateInfo) => {
      console.log('收到数据更新通知:', updateInfo);
      
      // 当城市数据更新时重新加载
      if (updateInfo.type === 'city_updated' || updateInfo.type === 'city_deleted') {
        loadCities();
      }
    });

    return unsubscribe;
  }, []);

  // === 搜索过滤 ===
  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return cities;
    
    const query = searchQuery.toLowerCase();
    return cities.filter(city => 
      city.name.toLowerCase().includes(query) ||
      city.province.toLowerCase().includes(query) ||
      city.id.toLowerCase().includes(query)
    );
  }, [cities, searchQuery]);

  // === 事件处理 ===
  const handleCreateCity = () => {
    setSelectedCity(null);
    setIsCreating(true);
    setIsEditDialogOpen(true);
  };

  const handleEditCity = (city) => {
    setSelectedCity(city);
    setIsCreating(false);
    setIsEditDialogOpen(true);
  };

  const handleDeleteCity = (city) => {
    setDeleteConfirmCity(city);
  };

  const confirmDeleteCity = async () => {
    if (!deleteConfirmCity) return;
    
    try {
      const success = await cityDatabaseService.deleteCity(deleteConfirmCity.id);
      if (success) {
        console.log(`✅ 城市 ${deleteConfirmCity.name} 删除成功`);
        // 数据会通过订阅事件自动刷新
      } else {
        setError('删除城市失败');
      }
    } catch (err) {
      console.error('删除城市失败:', err);
      setError('删除城市失败，请重试');
    } finally {
      setDeleteConfirmCity(null);
    }
  };

  const cancelDeleteCity = () => {
    setDeleteConfirmCity(null);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  const handleDialogClose = () => {
    setIsEditDialogOpen(false);
    setSelectedCity(null);
    setIsCreating(false);
  };

  // === 渲染状态 ===
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3 text-blue-400">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
            <span>加载城市列表...</span>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3 text-red-400">
            <AlertTriangle className="w-6 h-6" />
            <span>{error}</span>
            <button 
              onClick={loadCities}
              className="ml-3 px-3 py-1 text-sm bg-red-600 hover:bg-red-700 rounded transition-colors"
            >
              重试
            </button>
          </div>
        </div>
      );
    }

    if (filteredCities.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Building2 className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-lg mb-2">
            {searchQuery ? '未找到匹配的城市' : '暂无城市配置'}
          </p>
          <p className="text-sm mb-4">
            {searchQuery ? '尝试调整搜索条件' : '点击上方按钮创建第一个城市'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredCities.map((city) => (
            <CityListItem
              key={city.id}
              city={city}
              onEdit={() => handleEditCity(city)}
              onDelete={() => handleDeleteCity(city)}
            />
          ))}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题和操作栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">城市管理</h1>
          <p className="text-gray-400">
            管理卡车配送城市配置，包括区域划分和价格策略
          </p>
        </div>

        <motion.button
          onClick={handleCreateCity}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-5 h-5" />
          <span>新建城市</span>
        </motion.button>
      </div>

      {/* 搜索栏 */}
      <div className="max-w-md">
        <AnimatedSearchBox
          onSearch={handleSearchChange}
          placeholder="搜索城市名称、省份..."
          searchHistory={[]}
        />
      </div>

      {/* 统计信息 */}
      {!isLoading && !error && (
        <div className="flex items-center space-x-6 text-sm text-gray-400">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4" />
            <span>总共 {cities.length} 个城市</span>
          </div>
          {searchQuery && (
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>找到 {filteredCities.length} 个匹配项</span>
            </div>
          )}
        </div>
      )}

      {/* 城市列表 */}
      {renderContent()}

      {/* 编辑对话框 */}
      <CityEditDialog
        isOpen={isEditDialogOpen}
        onClose={handleDialogClose}
        cityData={selectedCity}
        isCreating={isCreating}
      />

      {/* 删除确认对话框 */}
      <DeleteConfirmDialog
        isOpen={!!deleteConfirmCity}
        city={deleteConfirmCity}
        onConfirm={confirmDeleteCity}
        onCancel={cancelDeleteCity}
      />
    </div>
  );
};

/**
 * 城市列表项组件
 */
const CityListItem = ({ city, onEdit, onDelete }) => {
  const [isSelected, setIsSelected] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      onClick={() => setIsSelected(!isSelected)}
      className={`bg-gray-800 rounded-lg border ${isSelected ? 'border-blue-500' : 'border-gray-700'}
                 p-4 hover:border-gray-600 transition-all cursor-pointer`}
    >
      <div className="flex items-center justify-between">
        {/* 左侧：城市信息 */}
        <div className="flex items-center space-x-4 flex-1">
          {/* 主题色指示器 */}
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: city.themeColor || '#6B7280' }}
          />

          {/* 城市名称 */}
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold text-white">{city.name}</h3>
              {city.isActive && (
                <CheckCircle className="w-4 h-4 text-green-400" title="已启用" />
              )}
            </div>
          </div>
        </div>

        {/* 右侧：统计信息和操作按钮 */}
        <div className="flex items-center space-x-6">
          {/* 统计信息 */}
          <div className="flex items-center space-x-6 text-sm text-gray-400">
            <div className="text-right">
              <div className="text-white font-medium">{city.regionCount}</div>
              <div className="text-xs">区域</div>
            </div>
            <div className="text-right">
              <div className="text-white font-medium">{city.totalFSAs}</div>
              <div className="text-xs">FSA</div>
            </div>
            <div className="text-right">
              <div className="text-white font-medium">0</div>
              <div className="text-xs">价格</div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center space-x-2">
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="flex items-center space-x-1 px-3 py-1.5 text-blue-400 hover:bg-blue-900/30 rounded transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Edit3 className="w-4 h-4" />
              <span className="text-sm">编辑</span>
            </motion.button>

            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="flex items-center space-x-1 px-3 py-1.5 text-red-400 hover:bg-red-900/30 rounded transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm">删除</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * 城市卡片组件（保留但不使用）
 */
const CityCard = ({ city, onEdit, onDelete }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-gray-600 transition-all"
    >
      {/* 城市头部 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {/* 主题色指示器 */}
          <div 
            className="w-4 h-4 rounded-full border-2 border-gray-600"
            style={{ backgroundColor: city.themeColor || '#6B7280' }}
          />
          
          <div>
            <h3 className="text-lg font-semibold text-white">{city.name}</h3>
            <p className="text-sm text-gray-400">{city.province}</p>
          </div>
        </div>

        {/* 状态指示器 */}
        <div className="flex items-center space-x-1">
          {city.isActive ? (
            <CheckCircle className="w-5 h-5 text-green-400" title="已启用" />
          ) : (
            <Eye className="w-5 h-5 text-gray-500" title="未启用" />
          )}
        </div>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div className="flex items-center space-x-2 text-gray-300">
          <Map className="w-4 h-4 text-blue-400" />
          <span>{city.regionCount} 个区域</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-300">
          <MapPin className="w-4 h-4 text-green-400" />
          <span>{city.totalFSAs} 个FSA</span>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center justify-end space-x-2">
        <motion.button
          onClick={onEdit}
          className="flex items-center space-x-1 px-3 py-2 text-blue-400 hover:bg-blue-900/30 rounded transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Edit3 className="w-4 h-4" />
          <span>编辑</span>
        </motion.button>

        <motion.button
          onClick={onDelete}
          className="flex items-center space-x-1 px-3 py-2 text-red-400 hover:bg-red-900/30 rounded transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Trash2 className="w-4 h-4" />
          <span>删除</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

/**
 * 删除确认对话框
 */
const DeleteConfirmDialog = ({ isOpen, city, onConfirm, onCancel }) => {
  if (!isOpen || !city) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-md w-full mx-4"
      >
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-400" />
          <h3 className="text-lg font-semibold text-white">确认删除城市</h3>
        </div>

        <p className="text-gray-300 mb-6">
          确定要删除城市 <span className="font-semibold text-white">"{city.name}"</span> 吗？
          <br />
          <span className="text-sm text-red-400">
            此操作将同时删除该城市的所有区域和配置数据，且不可恢复。
          </span>
        </p>

        <div className="flex items-center justify-end space-x-3">
          <motion.button
            onClick={onCancel}
            className="px-4 py-2 text-gray-300 hover:bg-gray-700 rounded transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            取消
          </motion.button>
          
          <motion.button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            确认删除
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default CityManager;