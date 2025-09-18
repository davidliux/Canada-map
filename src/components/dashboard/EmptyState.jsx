import React from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Search,
  MapPin,
  Building2,
  Plus,
  ArrowRight
} from 'lucide-react';

/**
 * 空状态组件
 * 当没有数据时显示友好的提示
 * Requirements: 设计4.2
 */
const EmptyState = ({
  type = 'default',
  title,
  description,
  actionLabel,
  onAction,
  icon: CustomIcon,
  className = ''
}) => {
  // 预设的空状态类型
  const presets = {
    default: {
      icon: Package,
      title: '暂无数据',
      description: '当前没有可显示的内容',
      actionLabel: null
    },
    search: {
      icon: Search,
      title: '未找到结果',
      description: '尝试调整搜索条件或关键词',
      actionLabel: '清除搜索'
    },
    cities: {
      icon: Building2,
      title: '暂无城市数据',
      description: '请先配置城市和配送区域',
      actionLabel: '添加城市'
    },
    regions: {
      icon: MapPin,
      title: '暂无配送区域',
      description: '该城市还没有配置配送区域',
      actionLabel: '配置区域'
    },
    fsa: {
      icon: Package,
      title: '暂无FSA数据',
      description: '该区域还没有分配FSA代码',
      actionLabel: '分配FSA'
    }
  };

  const config = presets[type] || presets.default;
  const Icon = CustomIcon || config.icon;
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;
  const displayActionLabel = actionLabel || config.actionLabel;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center py-12 px-6 ${className}`}
    >
      {/* 图标容器 */}
      <motion.div
        className="relative mb-6"
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center">
          <Icon className="w-12 h-12 text-gray-600" />
        </div>

        {/* 装饰性圆环 */}
        <motion.div
          className="absolute inset-0 border-2 border-gray-700 rounded-full"
          animate={{
            scale: [1, 1.2],
            opacity: [0.5, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut'
          }}
        />
      </motion.div>

      {/* 标题 */}
      <h3 className="text-lg font-semibold text-white mb-2">
        {displayTitle}
      </h3>

      {/* 描述 */}
      <p className="text-sm text-gray-400 text-center max-w-sm mb-6">
        {displayDescription}
      </p>

      {/* 操作按钮 */}
      {displayActionLabel && onAction && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAction}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          {type === 'search' ? (
            <>
              {displayActionLabel}
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              {displayActionLabel}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      )}

      {/* 额外提示 */}
      {type === 'search' && (
        <div className="mt-6 p-4 bg-gray-800 rounded-lg max-w-md">
          <p className="text-xs text-gray-500 mb-2">搜索提示：</p>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• 输入城市名称查找特定城市</li>
            <li>• 输入FSA代码（如M5V）查找区域</li>
            <li>• 输入省份缩写（如ON）筛选省份</li>
          </ul>
        </div>
      )}
    </motion.div>
  );
};

// 简化版空状态组件
export const SimpleEmptyState = ({ message = '暂无数据', icon: Icon = Package }) => {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
      <Icon className="w-8 h-8 mb-2 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  );
};

export default EmptyState;