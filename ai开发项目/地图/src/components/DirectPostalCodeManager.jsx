import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Plus,
  Trash2,
  Search,
  Copy,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  Save,
  X,
  Package
} from 'lucide-react';
import {
  getRegionPostalCodes,
  setRegionPostalCodes,
  getRegionConfig
} from '../utils/unifiedStorage.js';

/**
 * 直接邮编管理组件
 * 为指定区域直接管理三位数邮编（FSA代码）
 */
const DirectPostalCodeManager = ({ 
  selectedRegion, 
  onPostalCodeChange,
  className = '' 
}) => {
  const [postalCodes, setPostalCodes] = useState([]);
  const [newPostalCode, setNewPostalCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [operationResult, setOperationResult] = useState(null);
  const [showBatchImport, setShowBatchImport] = useState(false);
  const [batchText, setBatchText] = useState('');

  // 使用统一存储架构
  // 不再需要单独的存储键，直接使用统一的区域配置

  // 加载区域邮编数据
  useEffect(() => {
    if (selectedRegion) {
      loadRegionPostalCodes();
    } else {
      setPostalCodes([]);
    }
  }, [selectedRegion]);

  /**
   * 初始化测试数据
   */
  const initializeTestData = (regionId) => {
    const testData = {
      '1': ['V6B', 'V6C', 'V5K'],
      '2': ['V7A', 'V7B', 'V7C'],
      '3': ['V8A', 'V8B', 'V8C'],
      '4': ['V9A', 'V9B', 'V9C'],
      '5': ['T2A', 'T2B', 'T2C'],
      '6': ['T3A', 'T3B', 'T3C'],
      '7': ['K1A', 'K1B', 'K1C'],
      '8': ['M5A', 'M5B', 'M5C']
    };

    const codes = testData[regionId] || [];
    setRegionPostalCodes(regionId, codes);
    console.log(`为区域 ${regionId} 初始化测试邮编数据:`, codes);
    return codes;
  };

  // 删除迁移逻辑 - 使用统一存储架构，不再需要数据迁移

  /**
   * 加载区域邮编配置
   */
  const loadRegionPostalCodes = () => {
    setIsLoading(true);
    try {
      // 使用统一存储架构直接获取邮编数据
      let codes = getRegionPostalCodes(selectedRegion);

      // 如果没有数据，初始化测试数据
      if (codes.length === 0) {
        console.log(`区域 ${selectedRegion} 没有邮编数据，初始化测试数据...`);
        codes = initializeTestData(selectedRegion);
      }

      console.log(`加载区域 ${selectedRegion} 的邮编数据:`, codes);
      setPostalCodes(codes);
    } catch (error) {
      console.error('加载区域邮编数据失败:', error);
      setOperationResult({
        type: 'error',
        message: `加载失败: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 保存区域邮编配置
   */
  const saveRegionPostalCodes = (updatedCodes) => {
    try {
      // 使用统一存储架构保存邮编数据
      const success = setRegionPostalCodes(selectedRegion, updatedCodes);

      if (success) {
        onPostalCodeChange?.(selectedRegion, updatedCodes);
        return true;
      } else {
        console.error('保存区域邮编数据失败');
        return false;
      }
    } catch (error) {
      console.error('保存区域邮编数据失败:', error);
      return false;
    }
  };

  /**
   * 验证三位数邮编格式（FSA代码）
   */
  const validateFSACode = (code) => {
    const cleanCode = code.trim().toUpperCase();
    // 加拿大FSA格式：A1A（字母-数字-字母）
    const regex = /^[A-Z]\d[A-Z]$/;
    return regex.test(cleanCode);
  };

  /**
   * 格式化FSA代码
   */
  const formatFSACode = (code) => {
    return code.trim().toUpperCase();
  };

  /**
   * 添加邮编
   */
  const handleAddPostalCode = async () => {
    console.log('添加邮编按钮点击，输入值:', newPostalCode);
    
    if (!newPostalCode.trim()) {
      console.log('邮编输入为空，返回');
      return;
    }

    const formattedCode = formatFSACode(newPostalCode);
    console.log('格式化后的邮编:', formattedCode);
    
    // 验证格式
    if (!validateFSACode(formattedCode)) {
      console.log('邮编格式验证失败');
      setOperationResult({
        type: 'error',
        message: '邮编格式不正确，请使用三位数FSA格式 (例: V6B)'
      });
      return;
    }

    // 检查重复
    if (postalCodes.includes(formattedCode)) {
      console.log('邮编重复');
      setOperationResult({
        type: 'error',
        message: '邮编已存在'
      });
      return;
    }

    const updatedCodes = [...postalCodes, formattedCode].sort();
    console.log('准备保存邮编列表:', updatedCodes);
    const success = saveRegionPostalCodes(updatedCodes);
    
    if (success) {
      console.log('邮编保存成功');
      setPostalCodes(updatedCodes);
      setNewPostalCode('');
      setOperationResult({
        type: 'success',
        message: '邮编添加成功'
      });
    } else {
      console.log('邮编保存失败');
      setOperationResult({
        type: 'error',
        message: '邮编添加失败'
      });
    }
  };

  /**
   * 删除邮编
   */
  const handleRemovePostalCode = async (codeToRemove) => {
    const updatedCodes = postalCodes.filter(code => code !== codeToRemove);
    const success = saveRegionPostalCodes(updatedCodes);
    
    if (success) {
      setPostalCodes(updatedCodes);
      setOperationResult({
        type: 'success',
        message: '邮编删除成功'
      });
    } else {
      setOperationResult({
        type: 'error',
        message: '邮编删除失败'
      });
    }
  };

  /**
   * 批量导入邮编
   */
  const handleBatchImport = async () => {
    if (!batchText.trim()) return;

    const codes = batchText
      .split(/[\n,;]/)
      .map(code => formatFSACode(code.trim()))
      .filter(code => code && validateFSACode(code))
      .filter((code, index, arr) => arr.indexOf(code) === index); // 去重

    const newCodes = codes.filter(code => !postalCodes.includes(code));
    
    if (newCodes.length === 0) {
      setOperationResult({
        type: 'warning',
        message: '没有找到有效的新邮编'
      });
      return;
    }

    const updatedCodes = [...postalCodes, ...newCodes].sort();
    const success = saveRegionPostalCodes(updatedCodes);
    
    if (success) {
      setPostalCodes(updatedCodes);
      setBatchText('');
      setShowBatchImport(false);
      setOperationResult({
        type: 'success',
        message: `成功导入 ${newCodes.length} 个邮编`
      });
    } else {
      setOperationResult({
        type: 'error',
        message: '批量导入失败'
      });
    }
  };

  /**
   * 导出邮编列表
   */
  const handleExportPostalCodes = () => {
    if (postalCodes.length === 0) {
      setOperationResult({
        type: 'warning',
        message: '没有邮编可导出'
      });
      return;
    }

    const text = postalCodes.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `region_${selectedRegion}_postal_codes.txt`;
    a.click();
    URL.revokeObjectURL(url);

    setOperationResult({
      type: 'success',
      message: '邮编列表导出成功'
    });
  };

  // 过滤邮编列表
  const filteredPostalCodes = postalCodes.filter(code =>
    code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!selectedRegion) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-300 mb-2">选择配送区域</h3>
        <p className="text-gray-400">请先选择一个配送区域来管理邮编</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="animate-spin w-8 h-8 border-2 border-cyber-blue border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-300">加载邮编数据...</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 标题和统计 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyber-blue/20 rounded-lg">
            <Mail className="w-5 h-5 text-cyber-blue" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">区域邮编管理</h3>
            <p className="text-gray-400 text-sm">
              配送区域：<span className="text-cyber-blue font-medium">{selectedRegion}区</span>
            </p>
          </div>
        </div>
        
        <div className="text-sm text-gray-400">
          共 {postalCodes.length} 个邮编
        </div>
      </div>

      {/* 操作结果显示 */}
      <AnimatePresence>
        {operationResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3 rounded-lg border ${
              operationResult.type === 'success' 
                ? 'bg-green-500/20 border-green-500/30' 
                : operationResult.type === 'warning'
                ? 'bg-yellow-500/20 border-yellow-500/30'
                : 'bg-red-500/20 border-red-500/30'
            }`}
          >
            <div className="flex items-center gap-2">
              {operationResult.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-green-300" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-300" />
              )}
              <span className={`text-sm ${
                operationResult.type === 'success' ? 'text-green-300' : 
                operationResult.type === 'warning' ? 'text-yellow-300' : 'text-red-300'
              }`}>
                {operationResult.message}
              </span>
              <button
                onClick={() => setOperationResult(null)}
                className="ml-auto text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 添加邮编 */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <input
            type="text"
            value={newPostalCode}
            onChange={(e) => setNewPostalCode(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddPostalCode()}
            placeholder="输入三位数邮编 (例: V6B)"
            className="flex-1 px-4 py-2 bg-cyber-gray/50 border border-cyber-blue/30 rounded-lg text-white placeholder-gray-400"
          />
          <button
            onClick={handleAddPostalCode}
            disabled={!newPostalCode.trim()}
            className="px-4 py-2 bg-cyber-blue/20 hover:bg-cyber-blue/30 border border-cyber-blue/30 rounded-lg text-cyber-blue transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 批量操作 */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowBatchImport(true)}
          className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-300 transition-colors flex items-center gap-2 text-sm"
        >
          <Upload className="w-4 h-4" />
          批量导入
        </button>
        <button
          onClick={handleExportPostalCodes}
          disabled={postalCodes.length === 0}
          className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 rounded-lg text-orange-300 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          导出列表
        </button>
      </div>

      {/* 批量导入对话框 */}
      <AnimatePresence>
        {showBatchImport && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-cyber-gray/30 border border-cyber-blue/30 rounded-lg space-y-3"
          >
            <h4 className="font-medium text-white">批量导入邮编</h4>
            <textarea
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              placeholder="每行一个邮编，或用逗号分隔&#10;例如：&#10;V6B&#10;V6C&#10;V5K"
              className="w-full h-32 px-3 py-2 bg-cyber-gray/50 border border-cyber-blue/30 rounded text-white placeholder-gray-400 resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={handleBatchImport}
                className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded text-green-300 transition-colors"
              >
                导入
              </button>
              <button
                onClick={() => {
                  setShowBatchImport(false);
                  setBatchText('');
                }}
                className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/30 rounded text-gray-300 transition-colors"
              >
                取消
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 搜索过滤 */}
      {postalCodes.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索邮编..."
            className="w-full pl-10 pr-4 py-2 bg-cyber-gray/50 border border-cyber-blue/30 rounded-lg text-white placeholder-gray-400"
          />
        </div>
      )}

      {/* 邮编列表 */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        <AnimatePresence>
          {filteredPostalCodes.map((code, index) => (
            <motion.div
              key={code}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.02 }}
              className="flex items-center justify-between p-3 bg-cyber-gray/20 border border-cyber-blue/20 rounded-lg"
            >
              <span className="text-white font-mono text-lg">{code}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(code)}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                  title="复制"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleRemovePostalCode(code)}
                  className="p-1 text-red-400 hover:text-red-300 transition-colors"
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {postalCodes.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>还没有添加任何邮编</p>
          <p className="text-sm">添加第一个三位数邮编开始配置</p>
        </div>
      )}

      {/* 统计信息 */}
      <div className="p-4 bg-cyber-gray/10 border border-cyber-blue/10 rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-cyber-blue">{postalCodes.length}</div>
            <div className="text-sm text-gray-400">总邮编数</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">{filteredPostalCodes.length}</div>
            <div className="text-sm text-gray-400">筛选结果</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">{selectedRegion}区</div>
            <div className="text-sm text-gray-400">当前区域</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectPostalCodeManager;
