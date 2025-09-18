import React from 'react';
import { motion } from 'framer-motion';

/**
 * 区域颜色图例组件
 * 显示每个区域的颜色
 */
const RegionColorLegend = ({ regions = [], className = '' }) => {
  // 如果没有区域数据，不显示图例
  if (!regions || regions.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className={`bg-gray-900/95 backdrop-blur-md border border-gray-700/50 rounded-lg shadow-2xl p-4 ${className}`}
    >
      {/* 标题 */}
      <div className="text-white font-semibold text-sm mb-3 flex items-center">
        <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-2"></div>
        区域图例
      </div>

      {/* 区域列表 */}
      <div className="space-y-2">
        {regions.map((region, index) => {
          // 获取区域的基础颜色
          const baseColor = region.color || region.displayColor || region.themeColor || '#6B7280';
          const regionName = region.name || region.regionName || `区域 ${region.id || index + 1}`;
          const fsaCount = (region.fsaCodes || region.fsa_codes || region.fsaList || []).length;

          return (
            <div
              key={region.id || index}
              className="flex items-center space-x-3 group hover:bg-gray-800/50 rounded px-1 py-0.5 transition-colors"
            >
              {/* 颜色块 */}
              <div
                className="relative group/color"
                style={{
                  backgroundColor: baseColor,
                  width: '24px',
                  height: '16px',
                  borderRadius: '3px',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              />

              {/* 区域名称 */}
              <div className="text-gray-300 text-xs flex-1 truncate">
                {regionName}
              </div>

              {/* FSA数量 */}
              <div className="text-gray-400 text-xs">
                {fsaCount} FSA
              </div>
            </div>
          );
        })}
      </div>

      {/* 说明文字 */}
      <div className="mt-3 pt-2 border-t border-gray-700/50">
        <p className="text-gray-400 text-xs">
          每个区域使用不同颜色标识
        </p>
      </div>
    </motion.div>
  );
};

export default RegionColorLegend;