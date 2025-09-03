import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Mail, 
  Plus, 
  Trash2, 
  Save, 
  X, 
  Search,
  Settings,
  AlertCircle,
  CheckCircle,
  Copy,
  Download,
  Upload
} from 'lucide-react';
import WeightRangeManager from './WeightRangeManager';
import { 
  createDefaultFSAConfig, 
  validateFSAConfig 
} from '../data/fsaManagement.js';
// 注意：FSAManagementPanel需要重构以使用统一存储架构
// 暂时注释掉fsaStorage导入，因为在统一架构中不再需要单独的FSA存储
// import { getFSAConfig, saveFSAConfig, deleteFSAConfig } from '../utils/fsaStorage.js';

/**
 * FSA分区管理面板组件
 * 提供分区选择、邮编绑定、价格配置的用户界面
 */
const FSAManagementPanel = ({ 
  selectedFSA = null, 
  onClose, 
  onConfigChange,
  className = '' 
}) => {
  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('postal'); // 'postal' | 'pricing'
  const [newPostalCode, setNewPostalCode] = useState('');
  const [postalCodeFilter, setPostalCodeFilter] = useState('');

  // 加载FSA配置
  useEffect(() => {
    if (selectedFSA) {
      setIsLoading(true);
      try {
        let fsaConfig = getFSAConfig(selectedFSA.fsaCode);
        
        if (!fsaConfig) {
          // 创建默认配置
          fsaConfig = createDefaultFSAConfig(
            selectedFSA.fsaCode,
            selectedFSA.province || '',
            selectedFSA.region || ''
          );
        }
        
        setConfig(fsaConfig);
        setErrors({});
      } catch (error) {
        console.error('加载FSA配置失败:', error);
        setErrors({ general: '加载配置失败' });
      } finally {
        setIsLoading(false);
      }
    }
  }, [selectedFSA]);

  /**
   * 保存配置
   */
  const handleSave = async () => {
    if (!config) return;
    
    setIsSaving(true);
    setErrors({});
    
    try {
      // 验证配置
      const validation = validateFSAConfig(config);
      if (!validation.isValid) {
        setErrors({ validation: validation.errors });
        return;
      }
      
      // 保存到本地存储
      const success = saveFSAConfig(config.fsaCode, config);
      if (success) {
        setSuccessMessage('配置保存成功');
        onConfigChange?.(config);
        
        // 3秒后清除成功消息
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrors({ general: '保存失败' });
      }
    } catch (error) {
      console.error('保存配置失败:', error);
      setErrors({ general: '保存过程中发生错误' });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * 添加邮编
   */
  const handleAddPostalCode = () => {
    if (!newPostalCode.trim()) return;
    
    const postalCode = newPostalCode.trim().toUpperCase();
    
    // 验证邮编格式
    if (!/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/.test(postalCode)) {
      setErrors({ postalCode: '邮编格式不正确 (例: V6B 1A1)' });
      return;
    }
    
    // 检查重复
    if (config.postalCodes.includes(postalCode)) {
      setErrors({ postalCode: '邮编已存在' });
      return;
    }
    
    setConfig({
      ...config,
      postalCodes: [...config.postalCodes, postalCode].sort()
    });
    
    setNewPostalCode('');
    setErrors({});
  };

  /**
   * 删除邮编
   */
  const handleRemovePostalCode = (postalCode) => {
    setConfig({
      ...config,
      postalCodes: config.postalCodes.filter(code => code !== postalCode)
    });
  };

  /**
   * 更新重量区间配置
   */
  const handleWeightRangesChange = (weightRanges) => {
    setConfig({
      ...config,
      weightRanges
    });
  };

  /**
   * 批量导入邮编
   */
  const handleBatchImportPostalCodes = (text) => {
    const codes = text
      .split(/[\n,;]/)
      .map(code => code.trim().toUpperCase())
      .filter(code => code && /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/.test(code))
      .filter((code, index, arr) => arr.indexOf(code) === index); // 去重
    
    const newCodes = codes.filter(code => !config.postalCodes.includes(code));
    
    if (newCodes.length > 0) {
      setConfig({
        ...config,
        postalCodes: [...config.postalCodes, ...newCodes].sort()
      });
    }
    
    return { imported: newCodes.length, total: codes.length };
  };

  /**
   * 导出邮编列表
   */
  const handleExportPostalCodes = () => {
    const text = config.postalCodes.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.fsaCode}_postal_codes.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 过滤邮编列表
  const filteredPostalCodes = config?.postalCodes.filter(code =>
    code.toLowerCase().includes(postalCodeFilter.toLowerCase())
  ) || [];

  if (!selectedFSA) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-300 mb-2">选择FSA分区</h3>
        <p className="text-gray-400">在地图上点击一个FSA分区开始配置</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <div className="animate-spin w-8 h-8 border-2 border-cyber-blue border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-300">加载配置中...</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-red-300 mb-2">加载失败</h3>
        <p className="text-gray-400">无法加载FSA配置</p>
      </div>
    );
  }

  return (
    <div className={`bg-cyber-gray/95 backdrop-blur-md border border-cyber-blue/30 rounded-xl shadow-2xl ${className}`}>
      {/* 头部 */}
      <div className="p-6 border-b border-cyber-blue/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyber-blue/20 rounded-lg">
              <MapPin className="w-6 h-6 text-cyber-blue" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">FSA分区管理</h2>
              <p className="text-gray-300">
                {config.fsaCode} - {config.province} {config.region}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* 保存按钮 */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-green-300 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? '保存中...' : '保存'}
            </button>
            
            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* 成功/错误消息 */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4 text-green-300" />
              <span className="text-green-300">{successMessage}</span>
            </motion.div>
          )}
          
          {errors.general && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-300" />
              <span className="text-red-300">{errors.general}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 标签页导航 */}
      <div className="px-6 pt-4">
        <div className="flex space-x-1 bg-cyber-gray/50 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('postal')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'postal'
                ? 'bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Mail className="w-4 h-4 inline mr-2" />
            邮编绑定
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'pricing'
                ? 'bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            价格配置
          </button>
        </div>
      </div>

      {/* 标签页内容 */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'postal' && (
            <motion.div
              key="postal"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* 邮编管理 */}
              <PostalCodeManager
                postalCodes={config.postalCodes}
                onAdd={handleAddPostalCode}
                onRemove={handleRemovePostalCode}
                onBatchImport={handleBatchImportPostalCodes}
                onExport={handleExportPostalCodes}
                newPostalCode={newPostalCode}
                setNewPostalCode={setNewPostalCode}
                filter={postalCodeFilter}
                setFilter={setPostalCodeFilter}
                filteredCodes={filteredPostalCodes}
                errors={errors}
              />
            </motion.div>
          )}
          
          {activeTab === 'pricing' && (
            <motion.div
              key="pricing"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* 重量区间管理 */}
              <WeightRangeManager
                weightRanges={config.weightRanges}
                onChange={handleWeightRangesChange}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/**
 * 邮编管理子组件
 */
const PostalCodeManager = ({ 
  postalCodes, 
  onAdd, 
  onRemove, 
  onBatchImport, 
  onExport,
  newPostalCode,
  setNewPostalCode,
  filter,
  setFilter,
  filteredCodes,
  errors 
}) => {
  const [showBatchImport, setShowBatchImport] = useState(false);
  const [batchText, setBatchText] = useState('');

  const handleBatchImport = () => {
    const result = onBatchImport(batchText);
    setBatchText('');
    setShowBatchImport(false);
    
    // 显示导入结果
    if (result.imported > 0) {
      alert(`成功导入 ${result.imported} 个邮编`);
    }
  };

  return (
    <div className="space-y-6">
      {/* 邮编统计 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-cyber-blue/10 border border-cyber-blue/20 rounded-lg">
          <div className="text-2xl font-bold text-cyber-blue">{postalCodes.length}</div>
          <div className="text-sm text-gray-400">绑定邮编总数</div>
        </div>
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="text-2xl font-bold text-green-400">{filteredCodes.length}</div>
          <div className="text-sm text-gray-400">筛选结果</div>
        </div>
      </div>

      {/* 添加邮编 */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <input
            type="text"
            value={newPostalCode}
            onChange={(e) => setNewPostalCode(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onAdd()}
            placeholder="输入邮编 (例: V6B 1A1)"
            className="flex-1 px-4 py-2 bg-cyber-gray/50 border border-cyber-blue/30 rounded-lg text-white placeholder-gray-400"
          />
          <button
            onClick={onAdd}
            className="px-4 py-2 bg-cyber-blue/20 hover:bg-cyber-blue/30 border border-cyber-blue/30 rounded-lg text-cyber-blue transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        {errors.postalCode && (
          <p className="text-red-300 text-sm">{errors.postalCode}</p>
        )}
      </div>

      {/* 批量操作 */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowBatchImport(true)}
          className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-300 transition-colors flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          批量导入
        </button>
        <button
          onClick={onExport}
          disabled={postalCodes.length === 0}
          className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 rounded-lg text-orange-300 transition-colors flex items-center gap-2 disabled:opacity-50"
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
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="搜索邮编..."
            className="w-full pl-10 pr-4 py-2 bg-cyber-gray/50 border border-cyber-blue/30 rounded-lg text-white placeholder-gray-400"
          />
        </div>
      )}

      {/* 邮编列表 */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        <AnimatePresence>
          {filteredCodes.map((code, index) => (
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
                  onClick={() => onRemove(code)}
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
          <p>还没有绑定任何邮编</p>
          <p className="text-sm">添加第一个邮编开始配置</p>
        </div>
      )}
    </div>
  );
};

export default FSAManagementPanel;
