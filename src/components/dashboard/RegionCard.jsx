import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Package, Hash, Layers } from 'lucide-react';
import FSAGroupList from './FSAGroupList';

/**
 * 区域卡片组件
 * 显示区域名称、等级、FSA数量，支持展开/收起功能
 * Requirements: FR-012, FR-013, NFR-002
 */
const RegionCard = ({
  region,
  onRegionClick,
  onFSAGroupClick,
  highlightedFSAs = [],
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // 处理区域数据的不同字段名
  const regionName = region.name || region.zone_name || '未命名区域';
  const regionLevel = region.level || region.priority || 'standard';
  const fsaCodes = region.fsaCodes || region.fsa_codes || [];
  const fsaCount = fsaCodes.length;
  const themeColor = region.color || region.displayColor || region.themeColor || '#60A5FA';

  // 区域等级配置
  const levelConfig = {
    premium: {
      label: '高级',
      gradient: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30'
    },
    standard: {
      label: '标准',
      gradient: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30'
    },
    economy: {
      label: '经济',
      gradient: 'from-gray-500 to-gray-600',
      bgColor: 'bg-gray-500/10',
      borderColor: 'border-gray-500/30'
    }
  };

  const levelStyle = levelConfig[regionLevel] || levelConfig.standard;

  // 将FSA分组（每组5个）
  const fsaGroups = [];
  for (let i = 0; i < fsaCodes.length; i += 5) {
    fsaGroups.push({
      id: `group-${i}`,
      name: `组 ${Math.floor(i / 5) + 1}`,
      fsas: fsaCodes.slice(i, i + 5)
    });
  }

  const handleCardClick = () => {
    if (onRegionClick) {
      onRegionClick(region);
    }
  };

  const toggleExpand = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <motion.div
      className={`bg-gray-800 rounded-lg border ${levelStyle.borderColor} overflow-hidden ${className}`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {/* 卡片头部 */}
      <div
        className="p-4 cursor-pointer"
        onClick={handleCardClick}
      >
        {/* 等级标签 */}
        <div className="flex items-center justify-between mb-3">
          <span className={`px-2 py-1 text-xs font-medium rounded-full bg-gradient-to-r ${levelStyle.gradient} text-white`}>
            {levelStyle.label}
          </span>
          <button
            onClick={toggleExpand}
            className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </motion.div>
          </button>
        </div>

        {/* 区域名称 */}
        <h3 className="text-lg font-semibold text-white mb-3 truncate">
          {regionName}
        </h3>

        {/* 统计信息 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Package className="w-4 h-4" />
            <span>{fsaCount} FSA</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Layers className="w-4 h-4" />
            <span>{fsaGroups.length} 分组</span>
          </div>
        </div>

        {/* 高亮指示器 */}
        {highlightedFSAs.some(fsa => fsaCodes.includes(fsa)) && (
          <div className="mt-3 p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
            <p className="text-xs text-blue-400">包含高亮的FSA</p>
          </div>
        )}
      </div>

      {/* 展开内容 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-700"
          >
            <div className="p-4">
              <FSAGroupList
                groups={fsaGroups}
                onGroupClick={onFSAGroupClick}
                highlightedFSAs={highlightedFSAs}
                themeColor={themeColor}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 底部装饰线 */}
      <div
        className="h-1 bg-gradient-to-r opacity-50"
        style={{
          background: `linear-gradient(to right, ${themeColor}, transparent)`
        }}
      />
    </motion.div>
  );
};

export default React.memo(RegionCard);