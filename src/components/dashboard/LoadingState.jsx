import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

/**
 * 加载状态组件
 * 显示优雅的加载动画
 * Requirements: 设计4.2
 */
const LoadingState = ({
  message = '正在加载...',
  submessage = '',
  fullScreen = false,
  className = ''
}) => {
  const containerClass = fullScreen
    ? 'fixed inset-0 bg-gray-900/80 backdrop-blur z-50'
    : 'w-full h-full bg-gray-900/50';

  return (
    <div className={`${containerClass} flex items-center justify-center ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        {/* 主加载动画 */}
        <div className="relative mb-4">
          <motion.div
            className="w-20 h-20 mx-auto"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-full h-full text-blue-500" />
          </motion.div>

          {/* 脉冲环 */}
          <motion.div
            className="absolute inset-0 border-4 border-blue-500/30 rounded-full"
            animate={{
              scale: [1, 1.5],
              opacity: [0.5, 0]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeOut'
            }}
          />
        </div>

        {/* 文字提示 */}
        <motion.h3
          className="text-lg font-medium text-white mb-2"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {message}
        </motion.h3>

        {submessage && (
          <p className="text-sm text-gray-400">
            {submessage}
          </p>
        )}

        {/* 加载进度点 */}
        <div className="flex justify-center gap-1 mt-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-blue-500 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

// 骨架屏加载组件
export const SkeletonLoader = ({ count = 3, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          className="bg-gray-800 rounded-lg p-4"
          animate={{
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: index * 0.1
          }}
        >
          <div className="h-4 bg-gray-700 rounded w-3/4 mb-3" />
          <div className="h-3 bg-gray-700 rounded w-1/2" />
        </motion.div>
      ))}
    </div>
  );
};

// 内联加载指示器
export const InlineLoader = ({ size = 'sm', className = '' }) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className={`inline-block ${className}`}
    >
      <Loader2 className={`${sizeClasses[size]} text-blue-500`} />
    </motion.div>
  );
};

export default LoadingState;