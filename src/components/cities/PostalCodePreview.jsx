/**
 * 邮编预览组件
 * 
 * 简洁展示邮编样本，而不是使用复杂的全选框
 */

import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 邮编预览组件
 * @param {Object} props - 组件属性
 * @param {string[]} props.postalCodes - 邮编列表
 * @param {string} props.fsaCode - FSA代码
 * @param {string} [props.className] - 自定义样式类
 */
const PostalCodePreview = ({ 
  postalCodes = [], 
  fsaCode,
  className = '' 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 计算显示的样本邮编
  const previewData = useMemo(() => {
    if (!postalCodes || postalCodes.length === 0) {
      return {
        samples: [],
        total: 0,
        hasMore: false
      };
    }
    
    // 排序邮编
    const sorted = [...postalCodes].sort();
    
    // 取前3个作为样本
    const sampleCount = 3;
    const samples = sorted.slice(0, sampleCount);
    const hasMore = sorted.length > sampleCount;
    
    return {
      samples,
      total: sorted.length,
      hasMore,
      allCodes: sorted
    };
  }, [postalCodes]);
  
  if (previewData.total === 0) {
    return (
      <div className={`text-sm text-gray-500 italic ${className}`}>
        无邮编数据
      </div>
    );
  }
  
  return (
    <div className={`${className}`}>
      {/* 预览行 */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* 样本邮编展示 */}
        <div className="flex items-center gap-2">
          {previewData.samples.map((code, index) => (
            <span
              key={code}
              className="inline-flex items-center px-2 py-0.5 text-xs font-mono
                bg-gray-700 text-gray-300 rounded border border-gray-600"
            >
              {code}
            </span>
          ))}
          
          {previewData.hasMore && (
            <>
              <span className="text-gray-500 text-xs">...</span>
              <span className="text-xs text-gray-400">
                共 {previewData.total} 个
              </span>
            </>
          )}
        </div>
        
        {/* 展开/收起按钮 */}
        {previewData.total > 3 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs
              text-blue-400 hover:text-blue-300 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                收起
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                查看全部
              </>
            )}
          </button>
        )}
      </div>
      
      {/* 展开的完整列表 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 overflow-hidden"
          >
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  FSA {fsaCode} 的所有邮编
                </h4>
                <span className="text-xs text-gray-500">
                  {previewData.total} 个邮编
                </span>
              </div>
              
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2
                max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {previewData.allCodes.map((code) => (
                  <div
                    key={code}
                    className="px-2 py-1 text-xs font-mono text-center
                      bg-gray-700 text-gray-300 rounded border border-gray-600
                      hover:bg-gray-600 hover:border-gray-500 transition-colors"
                    title={code}
                  >
                    {code}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PostalCodePreview;