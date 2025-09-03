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
  X
} from 'lucide-react';
// 注意：PostalCodeManager需要重构以使用统一存储架构
// 暂时注释掉fsaStorage导入，因为在统一架构中不再需要单独的FSA存储
// import { getFSAConfig, saveFSAConfig } from '../utils/fsaStorage.js';

/**
 * 邮编管理组件
 * 为指定FSA提供邮编的增删改查功能
 */
const PostalCodeManager = ({ 
  selectedFSA, 
  selectedRegion,
  onPostalCodeChange,
  className = '' 
}) => {
  const [fsaConfig, setFSAConfig] = useState(null);
  const [postalCodes, setPostalCodes] = useState([]);
  const [newPostalCode, setNewPostalCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [operationResult, setOperationResult] = useState(null);
  const [showBatchImport, setShowBatchImport] = useState(false);
  const [batchText, setBatchText] = useState('');

  // 加载FSA配置
  useEffect(() => {
    console.log('PostalCodeManager: selectedFSA changed:', selectedFSA);
    if (selectedFSA) {
      loadFSAConfig();
    } else {
      setFSAConfig(null);
      setPostalCodes([]);
    }
  }, [selectedFSA]);

  /**
   * 加载FSA配置
   */
  const loadFSAConfig = async () => {
    setIsLoading(true);
    try {
      const config = getFSAConfig(selectedFSA);
      if (config) {
        setFSAConfig(config);
        setPostalCodes(config.postalCodes || []);
      } else {
        // 如果没有配置，创建默认配置
        const defaultConfig = {
          fsaCode: selectedFSA,
          assignedRegion: selectedRegion,
          province: '',
          region: '',
          postalCodes: [],
          isActive: true,
          lastUpdated: new Date().toISOString(),
          metadata: {
            createdAt: new Date().toISOString(),
            version: '2.0.0',
            notes: ''
          }
        };
        setFSAConfig(defaultConfig);
        setPostalCodes([]);
      }
    } catch (error) {
      console.error('加载FSA配置失败:', error);
      setOperationResult({
        type: 'error',
        message: `加载失败: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 保存FSA配置
   */
  const saveFSAConfiguration = async (updatedPostalCodes) => {
    if (!fsaConfig) return false;

    try {
      const updatedConfig = {
        ...fsaConfig,
        postalCodes: updatedPostalCodes,
        lastUpdated: new Date().toISOString()
      };

      const success = saveFSAConfig(selectedFSA, updatedConfig);
      if (success) {
        setFSAConfig(updatedConfig);
        onPostalCodeChange?.(updatedConfig);
        return true;
      }
      return false;
    } catch (error) {
      console.error('保存FSA配置失败:', error);
      return false;
    }
  };

  /**
   * 验证邮编格式
   */
  const validatePostalCode = (code) => {
    const cleanCode = code.trim().toUpperCase();
    // 加拿大邮编格式：A1A 1A1 或 A1A1A1
    const regex = /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/;
    return regex.test(cleanCode);
  };

  /**
   * 格式化邮编
   */
  const formatPostalCode = (code) => {
    const cleanCode = code.replace(/\s/g, '').toUpperCase();
    if (cleanCode.length === 6) {
      return `${cleanCode.slice(0, 3)} ${cleanCode.slice(3)}`;
    }
    return code.toUpperCase();
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

    const formattedCode = formatPostalCode(newPostalCode);
    console.log('格式化后的邮编:', formattedCode);

    // 验证格式
    if (!validatePostalCode(formattedCode)) {
      console.log('邮编格式验证失败');
      setOperationResult({
        type: 'error',
        message: '邮编格式不正确，请使用加拿大邮编格式 (例: V6B 1A1)'
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
    const success = await saveFSAConfiguration(updatedCodes);

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
    const success = await saveFSAConfiguration(updatedCodes);
    
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
      .map(code => formatPostalCode(code.trim()))
      .filter(code => code && validatePostalCode(code))
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
    const success = await saveFSAConfiguration(updatedCodes);
    
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
    a.download = `${selectedFSA}_postal_codes.txt`;
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

  if (!selectedFSA) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-300 mb-2">选择FSA分区</h3>
        <p className="text-gray-400">请先在FSA分配管理中双击一个FSA分区来管理邮编</p>
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-blue-300 text-sm">
            💡 提示：在"FSA分配管理"标签页中，双击任意FSA项目即可进入邮编管理
          </p>
        </div>
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
            <h3 className="text-lg font-semibold text-white">邮编管理</h3>
            <p className="text-gray-400 text-sm">
              FSA分区：<span className="text-cyber-blue font-medium">{selectedFSA}</span>
              {fsaConfig?.province && ` • ${fsaConfig.province}`}
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
            placeholder="输入邮编 (例: V6B 1A1)"
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
              placeholder="每行一个邮编，或用逗号分隔&#10;例如：&#10;V6B 1A1&#10;V6B 1A2&#10;V6B 1A3"
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
              <span className="text-white font-mono">{code}</span>
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
          <p className="text-sm">添加第一个邮编开始配置</p>
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
            <div className="text-2xl font-bold text-purple-400">
              {fsaConfig?.lastUpdated ? new Date(fsaConfig.lastUpdated).toLocaleDateString() : '-'}
            </div>
            <div className="text-sm text-gray-400">最后更新</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostalCodeManager;
