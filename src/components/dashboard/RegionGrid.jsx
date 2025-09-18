import React from 'react';
import { motion } from 'framer-motion';
import RegionCard from './RegionCard';
import { MapPin } from 'lucide-react';

/**
 * 区域网格容器组件
 * 实现响应式网格布局，自适应列数
 * Requirements: FR-011
 */
const RegionGrid = ({
  cityName = '',
  regions = [],
  onRegionClick,
  onFSAGroupClick,
  highlightedFSAs = [],
  className = ''
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <div className={`p-6 h-full overflow-auto ${className}`}>
      {/* 标题栏 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <MapPin className="w-6 h-6 text-blue-500" />
            {cityName}
          </h2>
          <p className="text-gray-400 mt-1">
            共 {regions.length} 个配送区域
          </p>
        </div>
      </div>

      {/* 区域网格 */}
      {regions.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {regions.map((region, index) => (
            <motion.div
              key={region.id || index}
              variants={itemVariants}
            >
              <RegionCard
                region={region}
                onRegionClick={onRegionClick}
                onFSAGroupClick={onFSAGroupClick}
                highlightedFSAs={highlightedFSAs}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <MapPin className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg">该城市暂无配送区域</p>
          <p className="text-sm mt-2">请在管理界面中添加配送区域</p>
        </div>
      )}
    </div>
  );
};

export default RegionGrid;