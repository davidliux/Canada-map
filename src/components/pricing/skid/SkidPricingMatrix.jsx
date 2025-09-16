/**
 * 板数定价矩阵组件
 *
 * 提供Excel风格的板数定价配置界面，支持：
 * - 多区域价格配置（区域1-5）
 * - 板数范围定价（1-16+板）
 * - 批量编辑和导入导出
 * - 实时价格计算
 *
 * Task 17: Add grid header row for zones
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Grid,
  Map,
  Package,
  DollarSign,
  Edit3,
  Save,
  Download,
  Upload,
  Copy,
  Clipboard,
  AlertCircle,
  CheckCircle,
  Info,
  ChevronRight,
  MapPin,
  Layers
} from 'lucide-react';

import pricingService from '../../../services/pricingService.js';
import cityStorageService from '../../../utils/storage/cityStorage.js';

// 智能区域ID匹配函数
const findMatchingZoneId = (zoneConfig, pricingDataKeys) => {
  // 直接匹配
  if (pricingDataKeys.includes(zoneConfig.id)) {
    return zoneConfig.id;
  }

  // 按名称匹配
  if (pricingDataKeys.includes(zoneConfig.name)) {
    return zoneConfig.name;
  }

  // 按级别匹配（区域1, 区域2等）
  const levelBasedId = `区域${zoneConfig.level}`;
  if (pricingDataKeys.includes(levelBasedId)) {
    return levelBasedId;
  }

  // 尝试解析区域名称中的数字并匹配
  const nameMatch = zoneConfig.name.match(/区域(\d+)/);
  if (nameMatch) {
    const extractedNumber = nameMatch[1];
    const numberBasedId = `区域${extractedNumber}`;
    if (pricingDataKeys.includes(numberBasedId)) {
      return numberBasedId;
    }
  }

  // 如果是第一个区域，尝试匹配区域1
  if (zoneConfig.level === 1 && pricingDataKeys.includes('区域1')) {
    return '区域1';
  }

  // 如果是第二个区域，尝试匹配区域2
  if (zoneConfig.level === 2 && pricingDataKeys.includes('区域2')) {
    return '区域2';
  }

  // 最后尝试：如果价格数据只有少量key，按顺序匹配
  if (pricingDataKeys.length > 0 && zoneConfig.level <= pricingDataKeys.length) {
    const sortedKeys = pricingDataKeys.sort();
    const targetKey = sortedKeys[zoneConfig.level - 1];
    if (targetKey && targetKey.startsWith('区域')) {
      return targetKey;
    }
  }

  console.warn(`无法匹配区域ID: ${zoneConfig.id}, 名称: ${zoneConfig.name}, 级别: ${zoneConfig.level}，可用数据键: ${pricingDataKeys.join(', ')}`);
  return null;
};

// 默认板数范围
const DEFAULT_SKID_RANGES = [
  { skidCount: 1, displayName: '1板' },
  { skidCount: 2, displayName: '2板' },
  { skidCount: 3, displayName: '3板' },
  { skidCount: 4, displayName: '4板' },
  { skidCount: 5, displayName: '5板' },
  { skidCount: 6, displayName: '6板' },
  { skidCount: 7, displayName: '7板' },
  { skidCount: 8, displayName: '8板' },
  { skidCount: 9, displayName: '9板' },
  { skidCount: 10, displayName: '10板' },
  { skidCount: 11, displayName: '11板' },
  { skidCount: 12, displayName: '12板' },
  { skidCount: 13, displayName: '13板' },
  { skidCount: 14, displayName: '14板' },
  { skidCount: 15, displayName: '15板' },
  { skidCount: 16, displayName: '16板' },
  { skidCount: '16+', displayName: '16+板' }
];

// 生成区域配置
const generateZoneConfig = (zone, index) => {
  const colors = [
    { color: 'from-blue-500/20 to-blue-600/20', borderColor: 'border-blue-500/50', headerBg: 'bg-gradient-to-r from-blue-500/10 to-blue-600/10' },
    { color: 'from-green-500/20 to-green-600/20', borderColor: 'border-green-500/50', headerBg: 'bg-gradient-to-r from-green-500/10 to-green-600/10' },
    { color: 'from-yellow-500/20 to-yellow-600/20', borderColor: 'border-yellow-500/50', headerBg: 'bg-gradient-to-r from-yellow-500/10 to-yellow-600/10' },
    { color: 'from-orange-500/20 to-orange-600/20', borderColor: 'border-orange-500/50', headerBg: 'bg-gradient-to-r from-orange-500/10 to-orange-600/10' },
    { color: 'from-red-500/20 to-red-600/20', borderColor: 'border-red-500/50', headerBg: 'bg-gradient-to-r from-red-500/10 to-red-600/10' },
    { color: 'from-purple-500/20 to-purple-600/20', borderColor: 'border-purple-500/50', headerBg: 'bg-gradient-to-r from-purple-500/10 to-purple-600/10' },
    { color: 'from-pink-500/20 to-pink-600/20', borderColor: 'border-pink-500/50', headerBg: 'bg-gradient-to-r from-pink-500/10 to-pink-600/10' },
    { color: 'from-cyan-500/20 to-cyan-600/20', borderColor: 'border-cyan-500/50', headerBg: 'bg-gradient-to-r from-cyan-500/10 to-cyan-600/10' }
  ];

  const colorConfig = colors[index % colors.length];
  const levelIcons = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧'];

  return {
    id: zone.id,
    name: zone.name || `区域 ${zone.level || index + 1}`,
    nameEn: zone.nameEn || `Zone ${zone.level || index + 1}`,
    level: zone.level || index + 1,
    ...colorConfig,
    icon: levelIcons[index] || `${index + 1}`,
    description: zone.description || `${zone.name || '配送区域'} - ${zone.fsaCodes?.length || 0}个FSA`,
    fsaCodes: zone.fsaCodes || [],
    postalCodes: zone.postalCodes || []
  };
};

/**
 * 板数定价矩阵组件
 */
const SkidPricingMatrix = ({
  cityId,
  zones = [],
  onSave,
  onExport,
  onChange,
  selectedZoneIndex = 0,
  locale = 'zh'
}) => {
  const [pricingData, setPricingData] = useState({});
  const [selectedCells, setSelectedCells] = useState([]);
  const [editingCell, setEditingCell] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [hoveredZone, setHoveredZone] = useState(null);

  // 生成动态区域配置
  const zoneConfigs = useMemo(() => {
    if (!zones || zones.length === 0) return [];
    return zones.map((zone, index) => generateZoneConfig(zone, index));
  }, [zones]);

  // 初始化价格数据
  useEffect(() => {
    if (cityId) {
      loadPricingData();
    }
  }, [cityId]);

  // 加载价格数据
  const loadPricingData = useCallback(async () => {
    try {
      const data = await pricingService.getSkidPricing(cityId) || {};
      setPricingData(data);
      setHasChanges(false);
      // 通知父组件初始数据
      if (onChange) {
        onChange(data);
      }
    } catch (error) {
      console.error('加载价格数据失败:', error);
    }
  }, [cityId, onChange]);

  // 更新单元格价格
  const handleCellEdit = useCallback((skidCount, zoneKey, newPrice) => {
    // zoneKey 应该是实际存储的键，如 "区域1", "区域2" 等
    const updatedData = {
      ...pricingData,
      [zoneKey]: {
        ...(pricingData[zoneKey] || {}),
        [skidCount]: newPrice
      }
    };
    setPricingData(updatedData);
    setHasChanges(true);
    if (onChange) {
      onChange(updatedData);
    }
  }, [onChange, pricingData]);

  // 保存价格数据
  const handleSave = useCallback(async () => {
    try {
      setSaveStatus('saving');
      await pricingService.saveSkidPricing(cityId, pricingData);
      if (onSave) {
        onSave(pricingData);
      }
      setSaveStatus('success');
      setHasChanges(false);
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error('保存价格数据失败:', error);
      setSaveStatus('error');
    }
  }, [cityId, pricingData, onSave]);

  // 渲染简单的表格头部 - 只显示板数和价格
  const renderSimpleHeader = () => {
    return (
      <div className="grid grid-cols-2 bg-gradient-to-r from-gray-800 to-gray-850 border-b-2 border-gray-700">
        <div className="p-4 text-center border-r border-gray-700">
          <div className="flex items-center justify-center gap-2">
            <Package className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-bold text-white">
              {locale === 'zh' ? '板数' : 'Skids'}
            </span>
          </div>
        </div>
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            <span className="text-sm font-bold text-white">
              {locale === 'zh' ? '价格 (CAD)' : 'Price (CAD)'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // 渲染价格单元格
  const renderPriceCell = (skidRange, zone) => {
    // 使用智能匹配查找正确的区域ID
    const pricingDataKeys = Object.keys(pricingData);
    const matchedZoneId = findMatchingZoneId(zone, pricingDataKeys);
    const price = matchedZoneId ? (pricingData[matchedZoneId]?.[skidRange.skidCount] || '') : '';
    const isEditing = editingCell === `${skidRange.skidCount}-${zone.id}`;



    return (
      <div
        key={`${skidRange.skidCount}-${zone.id}`}
        className="p-3 border-r border-gray-700 hover:bg-cyan-500/10
          transition-all duration-200 group cursor-pointer"
        onClick={() => setEditingCell(`${skidRange.skidCount}-${zone.id}`)}
      >
        {isEditing ? (
          <input
            type="number"
            value={price}
            onChange={(e) => {
              // 使用匹配到的zone键来保存数据
              const matchedKey = matchedZoneId || zone.name || `区域${zone.level}`;
              handleCellEdit(skidRange.skidCount, matchedKey, e.target.value);
            }}
            onBlur={() => setEditingCell(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setEditingCell(null);
              if (e.key === 'Escape') {
                setEditingCell(null);
                const matchedKey = matchedZoneId || zone.name || `区域${zone.level}`;
                handleCellEdit(skidRange.skidCount, matchedKey, price);
              }
            }}
            className="w-full px-2 py-1 bg-gray-800 border border-cyan-500/50 rounded text-sm
              text-white focus:outline-none focus:border-cyan-400 text-center"
            autoFocus
            step="0.01"
            min="0"
          />
        ) : (
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-white font-medium">
              {price ? `$${parseFloat(price).toFixed(2)}` : '-'}
            </span>
            <Edit3 className="w-3 h-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>
    );
  };

  // 渲染简单的价格表格 - 针对单个区域
  const renderSimpleGrid = (selectedZoneIndex = 0) => {
    const selectedZone = zoneConfigs[selectedZoneIndex];
    if (!selectedZone) return null;

    // 检查价格数据是否已加载
    const pricingDataKeys = Object.keys(pricingData);
    const hasPricingData = pricingDataKeys.length > 0;

    return (
      <div className="overflow-auto max-h-[600px]">
        {DEFAULT_SKID_RANGES.map((skidRange, index) => {
          // 只在有价格数据时尝试匹配
          let matchedZoneId = null;
          let price = '';

          if (hasPricingData) {
            matchedZoneId = findMatchingZoneId(selectedZone, pricingDataKeys);
            price = matchedZoneId ? (pricingData[matchedZoneId]?.[skidRange.skidCount] || '') : '';
          }

          const isEditing = editingCell === `${skidRange.skidCount}-${selectedZone.id}`;

          return (
            <motion.div
              key={skidRange.skidCount}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
              className={`grid grid-cols-2 border-b border-gray-700
                ${index % 2 === 0 ? 'bg-gray-900/70' : 'bg-gray-850/50'}
                hover:bg-gray-800/80 transition-all group`}
            >
              {/* 板数标签 */}
              <div className="p-4 border-r border-gray-700 flex items-center justify-center">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center`}>
                    <span className="text-cyan-400 font-bold text-sm">{index + 1}</span>
                  </div>
                  <span className="text-sm text-gray-200 font-semibold">
                    {skidRange.displayName}
                  </span>
                </div>
              </div>

              {/* 价格输入 */}
              <div
                className="p-4 flex items-center justify-center cursor-pointer hover:bg-cyan-500/5 transition-colors"
                onClick={() => setEditingCell(`${skidRange.skidCount}-${selectedZone.id}`)}
              >
                {isEditing ? (
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => handleCellEdit(skidRange.skidCount, matchedZoneId || selectedZone.id, e.target.value)}
                    onBlur={() => setEditingCell(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setEditingCell(null);
                      if (e.key === 'Escape') {
                        setEditingCell(null);
                        handleCellEdit(skidRange.skidCount, matchedZoneId || selectedZone.id, price);
                      }
                    }}
                    className="w-32 px-3 py-2 bg-gray-800 border-2 border-cyan-500/50 rounded-lg text-sm
                      text-white focus:outline-none focus:border-cyan-400 text-center"
                    autoFocus
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-lg text-white font-semibold">
                      {price ? `$${parseFloat(price).toFixed(2)}` : '-'}
                    </span>
                    <Edit3 className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  // 如果没有区域配置，显示提示
  if (!zones || zones.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-12 text-center">
        <Layers className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-300 mb-2">暂无区域配置</h3>
        <p className="text-gray-500">请先在区域管理中为城市配置区域</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 价格表格容器 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-br from-gray-900 to-gray-850 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden"
      >
        {/* 表格标题栏 */}
        <div className="bg-gray-800/50 px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <Grid className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {locale === 'zh' ? '价格矩阵配置' : 'Price Matrix Configuration'}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {locale === 'zh' ? '点击价格单元格进行编辑' : 'Click price cells to edit'}
                </p>
              </div>
            </div>
            {hasChanges && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-yellow-400"
              >
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{locale === 'zh' ? '有未保存的更改' : 'Unsaved changes'}</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* 渲染简单的表格头部 */}
        {renderSimpleHeader()}

        {/* 渲染简单的价格网格 */}
        {renderSimpleGrid(selectedZoneIndex)}
      </motion.div>

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
                {saveStatus === 'success' && (locale === 'zh' ? '保存成功' : 'Saved successfully')}
                {saveStatus === 'error' && (locale === 'zh' ? '保存失败' : 'Save failed')}
                {saveStatus === 'saving' && (locale === 'zh' ? '保存中...' : 'Saving...')}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SkidPricingMatrix;