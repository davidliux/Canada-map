import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MapPin, Package } from 'lucide-react';
import FSAChip from './FSAChip';

/**
 * 区域标签导航组件
 * 显示顶部的区域切换标签，支持城市级别的区域导航和FSA分组展示
 */
const RegionTabs = ({
  regions = [],
  selectedRegion = null,
  regionFSAGroups = [],  // 实际配置的FSA分组
  onRegionSelect,
  onFSAClick,
  onGroupClick,  // 新增：分组点击回调
  selectedGroup = null,  // 新增：当前选中的分组
  highlightedFSAs = [],
  className = ''
}) => {
  const [expandedRegion, setExpandedRegion] = useState(null);

  // 如果没有区域数据，返回空状态
  if (!regions || regions.length === 0) {
    return null;
  }

  const handleRegionClick = (region) => {
    onRegionSelect(region);
    // 展开/收起该区域的FSA分组
    if (expandedRegion?.id === region.id) {
      setExpandedRegion(null);
    } else {
      setExpandedRegion(region);
    }
  };

  // 获取区域的FSA分组（使用实际配置的分组或显示未分组FSA）
  const getFSAGroups = (region) => {
    // 如果有配置的分组，使用配置的分组
    if (regionFSAGroups && regionFSAGroups.length > 0) {
      return regionFSAGroups.map((group, index) => ({
        id: group.id || `group-${index}`,
        name: group.name || `分组${index + 1}`,
        fsas: group.fsaCodes || [],
        customPricing: group.customPricing || false
      }));
    }

    // 如果没有配置分组，显示所有未分组的FSA
    const fsaCodes = region.fsaCodes || region.fsa_codes || [];
    if (fsaCodes.length > 0) {
      // 将未分组的FSA按每组10个分页显示
      const ungroupedGroups = [];
      for (let i = 0; i < fsaCodes.length; i += 10) {
        ungroupedGroups.push({
          id: `ungrouped-${i}`,
          name: i === 0 ? '未分组FSA' : `未分组FSA (${Math.floor(i / 10) + 1})`,
          fsas: fsaCodes.slice(i, Math.min(i + 10, fsaCodes.length)),
          isUngrouped: true
        });
      }
      return ungroupedGroups;
    }

    return [];
  };

  return (
    <div className={`bg-gray-800 border-b border-gray-700 ${className}`}>
      {/* 区域标签行 */}
      <div className="px-4 py-2 border-b border-gray-700">
        <div className="flex items-center space-x-2 overflow-x-auto">
          {regions.map((region, index) => {
            const regionName = region.name || region.zone_name || `区域${index + 1}`;
            const isSelected = selectedRegion?.id === region.id;
            const isExpanded = expandedRegion?.id === region.id;
            const themeColor = region.color || region.displayColor || region.themeColor || '#60A5FA';
            const fsaCodes = region.fsaCodes || region.fsa_codes || [];

            return (
              <motion.button
                key={region.id || index}
                className={`
                  px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap
                  transition-all duration-200 flex items-center gap-2
                  ${isSelected
                    ? 'bg-gray-700 text-white border-2'
                    : 'bg-gray-900 text-gray-400 border border-gray-700 hover:border-gray-600 hover:text-white'
                  }
                `}
                style={{
                  borderColor: isSelected ? themeColor : undefined,
                  boxShadow: isSelected ? `0 0 10px ${themeColor}30` : undefined
                }}
                onClick={() => handleRegionClick(region)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <MapPin className="w-4 h-4" style={{ color: isSelected ? themeColor : undefined }} />
                <span className="font-semibold">{regionName}</span>
                <span className="text-xs opacity-75">({fsaCodes.length} FSA)</span>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* FSA分组展开区域 */}
      <AnimatePresence>
        {expandedRegion && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 bg-gray-900/50">
              <div className="flex flex-wrap gap-6">
                {getFSAGroups(expandedRegion).map((group) => {
                  const isGroupSelected = selectedGroup?.id === group.id;

                  return (
                    <div key={group.id} className="flex-shrink-0">
                      <h4
                        className={`
                          text-xs mb-2 font-medium flex items-center gap-2 cursor-pointer
                          hover:opacity-80 transition-all duration-200
                          ${isGroupSelected ? 'bg-gray-700 px-2 py-1 rounded' : ''}
                        `}
                        onClick={() => onGroupClick && onGroupClick(group, expandedRegion)}
                      >
                        <span className={
                          isGroupSelected
                            ? 'text-white'
                            : (group.isUngrouped ? 'text-gray-500' : 'text-blue-400')
                        }>
                          {group.name}
                        </span>
                        <span className={isGroupSelected ? 'text-gray-300' : 'text-gray-600'}>
                          ({group.fsas.length} FSA)
                        </span>
                      </h4>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                      {group.fsas.map((fsa) => (
                        <FSAChip
                          key={fsa}
                          code={fsa}
                          isHighlighted={highlightedFSAs.includes(fsa)}
                          themeColor={group.isUngrouped
                            ? '#9CA3AF'
                            : (expandedRegion.color || expandedRegion.displayColor || '#60A5FA')
                          }
                          onClick={() => onFSAClick && onFSAClick(fsa, expandedRegion.id)}
                        />
                      ))}
                    </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RegionTabs;