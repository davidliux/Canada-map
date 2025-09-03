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
  Edit3,
  FileText,
  Database,
  RefreshCw
} from 'lucide-react';

import {
  getRegionConfig,
  addPostalCodesToRegion,
  removePostalCodesFromRegion,
  updatePostalCodeInRegion,
  batchImportPostalCodes,
  validatePostalCode,
  findRegionByPostalCode
} from '../utils/unifiedStorage.js';

/**
 * 增强邮编管理组件
 * 提供完整的邮编CRUD操作功能
 */
const EnhancedPostalCodeManager = ({ 
  selectedRegion,
  onDataChange,
  className = '' 
}) => {
  const [regionConfig, setRegionConfig] = useState(null);
  const [postalCodes, setPostalCodes] = useState([]);
  const [newPostalCode, setNewPostalCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCode, setEditingCode] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [operationResult, setOperationResult] = useState(null);
  const [showBatchImport, setShowBatchImport] = useState(false);
  const [batchText, setBatchText] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // 加载区域配置
  useEffect(() => {
    if (selectedRegion) {
      loadRegionConfig();
    } else {
      setRegionConfig(null);
      setPostalCodes([]);
    }
  }, [selectedRegion]);

  /**
   * 加载区域配置
   */
  const loadRegionConfig = async () => {
    setIsLoading(true);
    try {
      const config = getRegionConfig(selectedRegion);
      if (config) {
        setRegionConfig(config);
        setPostalCodes(config.postalCodes || []);
      } else {
        setOperationResult({
          type: 'error',
          message: `区域 ${selectedRegion} 不存在`
        });
      }
    } catch (error) {
      console.error('加载区域配置失败:', error);
      setOperationResult({
        type: 'error',
        message: `加载失败: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 添加新邮编
   */
  const handleAddPostalCode = async () => {
    if (!newPostalCode.trim()) return;

    const validation = validatePostalCode(newPostalCode);
    if (!validation.isValid) {
      setValidationErrors({ newCode: validation.errors.join(', ') });
      return;
    }

    setIsLoading(true);
    try {
      const success = await addPostalCodesToRegion(selectedRegion, validation.formatted);
      if (success) {
        setNewPostalCode('');
        setValidationErrors({});
        await loadRegionConfig();
        setOperationResult({
          type: 'success',
          message: `成功添加邮编: ${validation.formatted}`
        });
        onDataChange?.();
      } else {
        setOperationResult({
          type: 'error',
          message: '添加邮编失败'
        });
      }
    } catch (error) {
      setOperationResult({
        type: 'error',
        message: `添加失败: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 删除邮编
   */
  const handleDeletePostalCode = async (postalCode) => {
    if (!confirm(`确定要删除邮编 ${postalCode} 吗？`)) return;

    setIsLoading(true);
    try {
      const success = await removePostalCodesFromRegion(selectedRegion, postalCode);
      if (success) {
        await loadRegionConfig();
        setOperationResult({
          type: 'success',
          message: `成功删除邮编: ${postalCode}`
        });
        onDataChange?.();
      } else {
        setOperationResult({
          type: 'error',
          message: '删除邮编失败'
        });
      }
    } catch (error) {
      setOperationResult({
        type: 'error',
        message: `删除失败: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 开始编辑邮编
   */
  const startEdit = (postalCode) => {
    setEditingCode(postalCode);
    setEditValue(postalCode);
    setValidationErrors({});
  };

  /**
   * 保存编辑
   */
  const saveEdit = async () => {
    if (!editValue.trim()) return;

    const validation = validatePostalCode(editValue);
    if (!validation.isValid) {
      setValidationErrors({ edit: validation.errors.join(', ') });
      return;
    }

    setIsLoading(true);
    try {
      const success = await updatePostalCodeInRegion(selectedRegion, editingCode, validation.formatted);
      if (success) {
        setEditingCode(null);
        setEditValue('');
        setValidationErrors({});
        await loadRegionConfig();
        setOperationResult({
          type: 'success',
          message: `成功更新邮编: ${editingCode} -> ${validation.formatted}`
        });
        onDataChange?.();
      } else {
        setOperationResult({
          type: 'error',
          message: '更新邮编失败'
        });
      }
    } catch (error) {
      setOperationResult({
        type: 'error',
        message: `更新失败: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 取消编辑
   */
  const cancelEdit = () => {
    setEditingCode(null);
    setEditValue('');
    setValidationErrors({});
  };

  /**
   * 批量导入邮编
   */
  const handleBatchImport = async () => {
    if (!batchText.trim()) return;

    const codes = batchText
      .split(/[\n,;]/)
      .map(code => code.trim())
      .filter(code => code);

    if (codes.length === 0) {
      setOperationResult({
        type: 'error',
        message: '没有有效的邮编数据'
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await batchImportPostalCodes(selectedRegion, codes, false);
      if (result.success) {
        setBatchText('');
        setShowBatchImport(false);
        await loadRegionConfig();
        setOperationResult({
          type: 'success',
          message: `批量导入完成: 添加 ${result.addedCount} 个，跳过 ${result.skippedCount} 个重复项`
        });
        onDataChange?.();
      } else {
        setOperationResult({
          type: 'error',
          message: `批量导入失败: ${result.error}`
        });
      }
    } catch (error) {
      setOperationResult({
        type: 'error',
        message: `批量导入失败: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 导出邮编数据
   */
  const handleExport = () => {
    if (postalCodes.length === 0) {
      setOperationResult({
        type: 'warning',
        message: '没有邮编数据可导出'
      });
      return;
    }

    const csvContent = postalCodes.join('\n');
    const blob = new Blob([csvContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `region_${selectedRegion}_postal_codes.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setOperationResult({
      type: 'success',
      message: '邮编数据导出成功'
    });
  };

  // 过滤邮编
  const filteredCodes = postalCodes.filter(code =>
    code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 清除操作结果提示
  useEffect(() => {
    if (operationResult) {
      const timer = setTimeout(() => {
        setOperationResult(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [operationResult]);

  if (!selectedRegion) {
    return (
      <div className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 ${className}`}>
        <div className="text-center text-gray-400">
          <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>请先选择一个配送区域</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 ${className}`}>
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Mail className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-bold text-white">
            邮编管理 - 区域 {selectedRegion}
          </h3>
          {regionConfig && (
            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-sm">
              {postalCodes.length} 个邮编
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowBatchImport(!showBatchImport)}
            className="px-3 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>批量导入</span>
          </button>
          
          <button
            onClick={handleExport}
            className="px-3 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>导出</span>
          </button>
          
          <button
            onClick={loadRegionConfig}
            disabled={isLoading}
            className="px-3 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>刷新</span>
          </button>
        </div>
      </div>

      {/* 操作结果提示 */}
      <AnimatePresence>
        {operationResult && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-4 p-3 rounded-lg flex items-center space-x-2 ${
              operationResult.type === 'success' ? 'bg-green-500/20 text-green-300' :
              operationResult.type === 'warning' ? 'bg-yellow-500/20 text-yellow-300' :
              'bg-red-500/20 text-red-300'
            }`}
          >
            {operationResult.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            <span>{operationResult.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 批量导入面板 */}
      <AnimatePresence>
        {showBatchImport && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600"
          >
            <h4 className="text-lg font-semibold text-white mb-3">批量导入邮编</h4>
            <p className="text-gray-400 text-sm mb-3">
              请输入邮编，每行一个，或用逗号、分号分隔
            </p>
            <textarea
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              placeholder="M5V 3A8&#10;M5V 3A9&#10;M5V 3B1"
              className="w-full h-32 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-none"
            />
            <div className="flex justify-end space-x-2 mt-3">
              <button
                onClick={() => setShowBatchImport(false)}
                className="px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleBatchImport}
                disabled={isLoading || !batchText.trim()}
                className="px-4 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '导入中...' : '导入'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 添加新邮编 */}
      <div className="mb-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
        <h4 className="text-lg font-semibold text-white mb-3">添加新邮编</h4>
        <div className="flex space-x-3">
          <div className="flex-1">
            <input
              type="text"
              value={newPostalCode}
              onChange={(e) => setNewPostalCode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddPostalCode()}
              placeholder="输入邮编 (如: M5V 3A8 或 M5V)"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            />
            {validationErrors.newCode && (
              <p className="text-red-400 text-sm mt-1">{validationErrors.newCode}</p>
            )}
          </div>
          <button
            onClick={handleAddPostalCode}
            disabled={isLoading || !newPostalCode.trim()}
            className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>添加</span>
          </button>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索邮编..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 邮编列表 */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-400" />
            <p className="text-gray-400">加载中...</p>
          </div>
        ) : filteredCodes.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            {searchQuery ? '没有找到匹配的邮编' : '暂无邮编数据'}
          </div>
        ) : (
          filteredCodes.map((code, index) => (
            <motion.div
              key={code}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors"
            >
              {editingCode === code ? (
                <div className="flex-1 flex items-center space-x-3">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') saveEdit();
                      if (e.key === 'Escape') cancelEdit();
                    }}
                    className="flex-1 px-3 py-1 bg-gray-800 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
                    autoFocus
                  />
                  {validationErrors.edit && (
                    <p className="text-red-400 text-sm">{validationErrors.edit}</p>
                  )}
                  <div className="flex space-x-2">
                    <button
                      onClick={saveEdit}
                      className="p-1 text-green-400 hover:text-green-300 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-1 text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center space-x-3">
                    <span className="text-white font-mono">{code}</span>
                    <span className="text-xs text-gray-400">
                      {validatePostalCode(code).type === 'FSA' ? 'FSA代码' : '完整邮编'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(code)}
                      className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                      title="复制"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => startEdit(code)}
                      className="p-1 text-gray-400 hover:text-yellow-400 transition-colors"
                      title="编辑"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePostalCode(code)}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* 统计信息 */}
      {regionConfig && (
        <div className="mt-6 p-4 bg-gray-700/30 rounded-lg border border-gray-600">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-400">{postalCodes.length}</div>
              <div className="text-sm text-gray-400">总邮编数</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">
                {postalCodes.filter(code => validatePostalCode(code).type === 'FSA').length}
              </div>
              <div className="text-sm text-gray-400">FSA代码</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">
                {postalCodes.filter(code => validatePostalCode(code).type === 'POSTAL_CODE').length}
              </div>
              <div className="text-sm text-gray-400">完整邮编</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">
                {regionConfig.isActive ? '启用' : '禁用'}
              </div>
              <div className="text-sm text-gray-400">区域状态</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedPostalCodeManager;
