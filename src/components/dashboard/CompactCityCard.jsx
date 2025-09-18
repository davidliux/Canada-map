import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Layers, Package } from 'lucide-react';

/**
 * 精简版城市卡片组件
 * 高度限制在80px，显示城市名、省份缩写、区域数、FSA数
 * Requirements: FR-005, FR-006
 */
const CompactCityCard = ({
  city,
  isSelected = false,
  onClick,
  className = ''
}) => {
  // 处理城市数据的不同字段名
  const cityName = city.name || city.city_name || '未知城市';
  const province = city.province || city.province_code || '';
  const regionCount = city.totalRegions || city.regions?.length || 0;
  const fsaCount = city.totalFSAs || 0;
  const themeColor = city.theme_color || city.themeColor || '#60A5FA';

  return (
    <motion.div
      className={`
        relative h-20 p-3 rounded-lg cursor-pointer
        bg-gray-800 border border-gray-700
        hover:border-gray-600 transition-all duration-300
        ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        ${className}
      `}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 选中状态指示器 */}
      {isSelected && (
        <div
          className="absolute inset-0 rounded-lg opacity-10"
          style={{ backgroundColor: themeColor }}
        />
      )}

      {/* 左侧色条 */}
      <div
        className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
        style={{ backgroundColor: themeColor }}
      />

      {/* 内容区 */}
      <div className="flex items-center justify-between h-full pl-3">
        {/* 城市信息 */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white truncate">
              {cityName}
            </h3>
            <span className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded">
              {province}
            </span>
          </div>

          {/* 统计信息 */}
          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Layers className="w-3 h-3" />
              <span>{regionCount} 区域</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Package className="w-3 h-3" />
              <span>{fsaCount} FSA</span>
            </div>
          </div>
        </div>

        {/* 右侧图标 */}
        <div className="flex items-center">
          <MapPin
            className={`w-5 h-5 ${isSelected ? 'text-blue-400' : 'text-gray-500'}`}
            style={{ color: isSelected ? themeColor : undefined }}
          />
        </div>
      </div>

      {/* 悬浮效果边框 */}
      <motion.div
        className="absolute inset-0 rounded-lg pointer-events-none"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div
          className="absolute inset-0 rounded-lg"
          style={{
            background: `linear-gradient(135deg, ${themeColor}20 0%, transparent 100%)`
          }}
        />
      </motion.div>
    </motion.div>
  );
};

export default React.memo(CompactCityCard);