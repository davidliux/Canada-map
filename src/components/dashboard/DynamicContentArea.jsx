import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RegionGrid from './RegionGrid';
import EmptyState from './EmptyState';

/**
 * 动态内容区容器组件
 * 显示选中城市的区域网格
 * Requirements: FR-009, FR-010
 */
const DynamicContentArea = ({
  selectedCity = null,
  cityRegions = [],
  onRegionClick,
  onFSAGroupClick,
  highlightedFSAs = [],
  className = ''
}) => {
  return (
    <div className={`flex-1 h-full overflow-hidden ${className}`}>
      <AnimatePresence mode="wait">
        {!selectedCity ? (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full flex items-center justify-center"
          >
            <EmptyState
              icon="MapPin"
              title="请选择城市"
              description="从左侧列表选择一个城市查看其区域分布"
            />
          </motion.div>
        ) : (
          <motion.div
            key="region-grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <RegionGrid
              cityName={selectedCity.name || selectedCity.city_name}
              regions={cityRegions}
              onRegionClick={onRegionClick}
              onFSAGroupClick={onFSAGroupClick}
              highlightedFSAs={highlightedFSAs}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DynamicContentArea;