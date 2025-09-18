import React from 'react';
import { motion } from 'framer-motion';

/**
 * FSA代码芯片组件
 * 支持点击高亮功能
 * Requirements: FR-015
 */
const FSAChip = ({
  code,
  isHighlighted = false,
  themeColor = '#60A5FA',
  onClick,
  className = ''
}) => {
  return (
    <motion.button
      className={`
        px-2 py-1 text-xs font-mono rounded
        transition-all duration-200 cursor-pointer
        ${isHighlighted
          ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50 shadow-lg shadow-blue-500/20'
          : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600 hover:text-gray-300'
        }
        ${className}
      `}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      style={{
        borderColor: isHighlighted ? themeColor : undefined,
        boxShadow: isHighlighted ? `0 0 10px ${themeColor}30` : undefined
      }}
    >
      {code}
      {isHighlighted && (
        <motion.span
          className="ml-1 inline-block w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: themeColor }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [1, 0.5, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </motion.button>
  );
};

export default React.memo(FSAChip);