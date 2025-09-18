import React from 'react';
import { motion } from 'framer-motion';
import { Hash, ChevronRight } from 'lucide-react';
import FSAChip from './FSAChip';

/**
 * FSA分组列表组件
 * 显示分组名称和包含的FSA代码
 * Requirements: FR-014, FR-015
 */
const FSAGroupList = ({
  groups = [],
  onGroupClick,
  highlightedFSAs = [],
  themeColor = '#60A5FA',
  className = ''
}) => {
  const handleGroupClick = (group) => {
    if (onGroupClick) {
      onGroupClick(group);
    }
  };

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
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  if (groups.length === 0) {
    return (
      <div className={`text-center py-4 text-gray-500 ${className}`}>
        <Hash className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">暂无FSA数据</p>
      </div>
    );
  }

  return (
    <motion.div
      className={`space-y-3 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {groups.map((group) => {
        const hasHighlight = group.fsas.some(fsa => highlightedFSAs.includes(fsa));

        return (
          <motion.div
            key={group.id}
            variants={itemVariants}
            className={`
              p-3 rounded-lg bg-gray-900/50 border border-gray-700
              hover:border-gray-600 transition-all duration-300 cursor-pointer
              ${hasHighlight ? 'ring-1 ring-blue-500/50' : ''}
            `}
            onClick={() => handleGroupClick(group)}
          >
            {/* 分组标题 */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-300">
                  {group.name}
                </span>
                <span className="text-xs text-gray-500">
                  ({group.fsas.length} FSA)
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </div>

            {/* FSA代码列表 */}
            <div className="flex flex-wrap gap-1.5">
              {group.fsas.map((fsa) => (
                <FSAChip
                  key={fsa}
                  code={fsa}
                  isHighlighted={highlightedFSAs.includes(fsa)}
                  themeColor={themeColor}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onGroupClick) {
                      onGroupClick({ ...group, fsas: [fsa] });
                    }
                  }}
                />
              ))}
            </div>

            {/* 高亮提示 */}
            {hasHighlight && (
              <div className="mt-2 flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: themeColor }}
                />
                <span className="text-xs text-blue-400">
                  包含地图高亮区域
                </span>
              </div>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default FSAGroupList;