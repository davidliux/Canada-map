import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Minus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  X,
  Check,
  Edit3,
  Trash2,
  Save,
  AlertCircle,
  Database,
  MapPin,
  FileText,
  Settings,
  ChevronDown,
  Copy,
  RefreshCw,
  ChevronRight,
  FolderOpen,
  Folder,
  FileSpreadsheet,
  Users
} from 'lucide-react';

// 导入用户真实数据
import { deliverableFSAs, getFSAsByProvince } from '../data/deliverableFSA.js';

// 增强的FSA存储管理器
class EnhancedFSAStorageManager {
  constructor() {
    this.storageKey = 'deliverable_fsa_list';
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.fsaList = JSON.parse(stored);
      } else {
        // 使用用户实际的806个FSA数据
        this.fsaList = [...deliverableFSAs];
        this.saveToStorage();
      }
    } catch (error) {
      console.error('加载FSA数据失败:', error);
      this.fsaList = [...deliverableFSAs];
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.fsaList));
      return true;
    } catch (error) {
      console.error('保存FSA数据失败:', error);
      return false;
    }
  }

  getAll() {
    return [...this.fsaList];
  }

  add(fsa) {
    const cleanFSA = fsa.toUpperCase().trim();
    if (!this.isValidFSA(cleanFSA)) {
      throw new Error('无效的FSA格式');
    }
    if (this.fsaList.includes(cleanFSA)) {
      throw new Error('FSA已存在');
    }
    this.fsaList.push(cleanFSA);
    this.fsaList.sort();
    return this.saveToStorage();
  }

  // 批量添加，支持自动覆盖重复项
  batchAdd(fsaArray, allowOverwrite = true) {
    const added = [];
    const updated = [];
    const errors = [];
    
    fsaArray.forEach(fsa => {
      try {
        const cleanFSA = fsa.toUpperCase().trim();
        if (this.isValidFSA(cleanFSA)) {
          if (this.fsaList.includes(cleanFSA)) {
            if (allowOverwrite) {
              updated.push(cleanFSA);
            }
          } else {
            this.fsaList.push(cleanFSA);
            added.push(cleanFSA);
          }
        } else {
          errors.push({ fsa, error: '无效的FSA格式' });
        }
      } catch (error) {
        errors.push({ fsa, error: error.message });
      }
    });

    this.fsaList.sort();
    this.saveToStorage();
    return { added, updated, errors };
  }

  // 批量删除整个省份
  removeProvince(province) {
    const removed = [];
    const beforeCount = this.fsaList.length;
    
    this.fsaList = this.fsaList.filter(fsa => {
      const fsaProvince = this.getProvinceFromFSA(fsa);
      if (fsaProvince === province) {
        removed.push(fsa);
        return false;
      }
      return true;
    });
    
    this.saveToStorage();
    return { removed, count: removed.length };
  }

  remove(fsa) {
    const index = this.fsaList.indexOf(fsa);
    if (index > -1) {
      this.fsaList.splice(index, 1);
      return this.saveToStorage();
    }
    return false;
  }

  update(oldFSA, newFSA) {
    const cleanNewFSA = newFSA.toUpperCase().trim();
    if (!this.isValidFSA(cleanNewFSA)) {
      throw new Error('无效的FSA格式');
    }
    const index = this.fsaList.indexOf(oldFSA);
    if (index > -1) {
      this.fsaList[index] = cleanNewFSA;
      this.fsaList.sort();
      return this.saveToStorage();
    }
    return false;
  }

  isValidFSA(fsa) {
    // 加拿大FSA格式: 字母+数字+字母 (如 V6B, M5V, H3G)
    return /^[A-Z][0-9][A-Z]$/i.test(fsa);
  }

  getProvinceFromFSA(fsa) {
    const firstChar = fsa.charAt(0).toUpperCase();
    const provinceMap = {
      'V': 'BC', 'L': 'ON', 'M': 'ON', 'N': 'ON', 'P': 'ON', 'K': 'ON',
      'H': 'QC', 'J': 'QC', 'G': 'QC',
      'T': 'AB', 'R': 'MB', 'S': 'SK',
      'B': 'NS', 'E': 'NB', 'A': 'NL', 'C': 'PE'
    };
    return provinceMap[firstChar] || 'OTHER';
  }

  getByProvince() {
    const byProvince = {};
    this.fsaList.forEach(fsa => {
      const province = this.getProvinceFromFSA(fsa);
      if (!byProvince[province]) byProvince[province] = [];
      byProvince[province].push(fsa);
    });
    return byProvince;
  }

  // 重置为默认数据
  resetToDefault() {
    this.fsaList = [...deliverableFSAs];
    this.saveToStorage();
    return this.fsaList.length;
  }

  exportToCSV() {
    const byProvince = this.getByProvince();
    let csvContent = 'FSA代码,省份,省份全名,总数\n';
    
    const provinceNames = {
      'BC': '不列颠哥伦比亚省',
      'ON': '安大略省',
      'QC': '魁北克省',
      'AB': '阿尔伯塔省',
      'MB': '马尼托巴省',
      'SK': '萨斯喀彻温省',
      'NS': '新斯科舍省',
      'NB': '新不伦瑞克省',
      'NL': '纽芬兰和拉布拉多省',
      'PE': '爱德华王子岛省'
    };

    Object.keys(byProvince).forEach(province => {
      byProvince[province].forEach(fsa => {
        csvContent += `${fsa},${province},${provinceNames[province] || province},${byProvince[province].length}\n`;
      });
    });

    return csvContent;
  }
}

const EnhancedFSAManager = ({ onDataChange }) => {
  const [storageManager] = useState(() => new EnhancedFSAStorageManager());
  const [fsaList, setFsaList] = useState([]);
  const [byProvince, setByProvince] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('all');
  const [expandedProvinces, setExpandedProvinces] = useState(new Set(['BC', 'ON', 'QC', 'AB']));
  const [isAddMode, setIsAddMode] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [newFSA, setNewFSA] = useState('');
  const [batchFSAs, setBatchFSAs] = useState('');
  const [editingFSA, setEditingFSA] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [notification, setNotification] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, provinces: 0 });
  
  const filterRef = useRef(null);

  const provinceNames = {
    'BC': '不列颠哥伦比亚省',
    'ON': '安大略省', 
    'QC': '魁北克省',
    'AB': '阿尔伯塔省',
    'MB': '马尼托巴省',
    'SK': '萨斯喀彻温省',
    'NS': '新斯科舍省',
    'NB': '新不伦瑞克省',
    'NL': '纽芬兰和拉布拉多省',
    'PE': '爱德华王子岛省'
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const refreshData = () => {
    const allFSAs = storageManager.getAll();
    const grouped = storageManager.getByProvince();
    setFsaList(allFSAs);
    setByProvince(grouped);
    setStats({
      total: allFSAs.length,
      provinces: Object.keys(grouped).length
    });
    
    // 通知父组件数据变化
    if (onDataChange) {
      onDataChange(allFSAs);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddFSA = () => {
    if (!newFSA.trim()) return;
    
    try {
      storageManager.add(newFSA);
      showNotification(`成功添加 FSA: ${newFSA.toUpperCase()}`);
      setNewFSA('');
      setIsAddMode(false);
      refreshData();
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  const handleBatchAdd = () => {
    if (!batchFSAs.trim()) return;
    
    // 解析批量数据（支持逗号、空格、换行分隔）
    const fsaArray = batchFSAs
      .split(/[,\s\n]+/)
      .map(fsa => fsa.trim())
      .filter(fsa => fsa.length > 0);
    
    const result = storageManager.batchAdd(fsaArray, true);
    
    let message = '';
    if (result.added.length > 0) {
      message += `新增 ${result.added.length} 个FSA`;
    }
    if (result.updated.length > 0) {
      message += (message ? ', ' : '') + `覆盖 ${result.updated.length} 个重复FSA`;
    }
    if (result.errors.length > 0) {
      message += (message ? ', ' : '') + `${result.errors.length} 个错误`;
    }
    
    showNotification(message, result.errors.length > 0 ? 'warning' : 'success');
    setBatchFSAs('');
    setIsBatchMode(false);
    refreshData();
  };

  const handleRemoveFSA = (fsa) => {
    if (storageManager.remove(fsa)) {
      showNotification(`已删除 FSA: ${fsa}`);
      refreshData();
    }
  };

  const handleRemoveProvince = (province) => {
    const result = storageManager.removeProvince(province);
    showNotification(`已删除 ${provinceNames[province]} 的 ${result.count} 个FSA`, 'warning');
    refreshData();
  };

  const handleEditFSA = (fsa) => {
    setEditingFSA(fsa);
    setEditValue(fsa);
  };

  const handleSaveEdit = () => {
    try {
      if (storageManager.update(editingFSA, editValue)) {
        showNotification(`已更新 FSA: ${editingFSA} → ${editValue.toUpperCase()}`);
        setEditingFSA(null);
        setEditValue('');
        refreshData();
      }
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  const handleResetToDefault = () => {
    const count = storageManager.resetToDefault();
    showNotification(`已重置为默认数据，共 ${count} 个FSA`, 'info');
    refreshData();
  };

  const handleExport = () => {
    const csvContent = storageManager.exportToCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `FSA_deliverable_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('CSV文件已导出');
  };

  const toggleProvinceExpansion = (province) => {
    const newExpanded = new Set(expandedProvinces);
    if (newExpanded.has(province)) {
      newExpanded.delete(province);
    } else {
      newExpanded.add(province);
    }
    setExpandedProvinces(newExpanded);
  };

  const filteredProvinces = Object.keys(byProvince).filter(province => {
    if (selectedProvince !== 'all' && province !== selectedProvince) return false;
    if (searchQuery) {
      return byProvince[province].some(fsa => 
        fsa.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  const getFilteredFSAs = (province) => {
    if (!searchQuery) return byProvince[province] || [];
    return (byProvince[province] || []).filter(fsa => 
      fsa.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-cyber-gray/90 backdrop-blur-md border border-cyber-light-gray rounded-xl p-6 shadow-xl"
    >
      {/* 通知 */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${
              notification.type === 'success' ? 'bg-cyber-green text-white' :
              notification.type === 'error' ? 'bg-red-500 text-white' :
              notification.type === 'warning' ? 'bg-yellow-500 text-black' :
              'bg-cyber-blue text-white'
            }`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 标题和统计 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyber-blue to-cyber-green rounded-lg flex items-center justify-center">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">FSA邮编管理</h3>
            <p className="text-gray-400 text-sm">管理可配送的前向分拣区域</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="bg-cyber-dark/50 px-3 py-2 rounded-lg">
            <span className="text-gray-400">总数: </span>
            <span className="text-cyber-green font-bold">{stats.total}</span>
          </div>
          <div className="bg-cyber-dark/50 px-3 py-2 rounded-lg">
            <span className="text-gray-400">省份: </span>
            <span className="text-cyber-blue font-bold">{stats.provinces}</span>
          </div>
        </div>
      </div>

      {/* 操作栏 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* 搜索和筛选 */}
        <div className="flex gap-3">
          <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索FSA邮编..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-cyber-dark border border-cyber-light-gray rounded-lg text-white placeholder-gray-400 focus:border-cyber-blue focus:outline-none transition-colors"
          />
        </div>

        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-cyber-light-gray hover:bg-cyber-blue/20 rounded-lg transition-colors text-white"
          >
            <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">
                {selectedProvince === 'all' ? '所有省份' : provinceNames[selectedProvince]}
              </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute top-full mt-2 bg-cyber-gray border border-cyber-blue/30 rounded-lg shadow-xl z-50 min-w-48"
              >
                <div className="p-2">
                  <button
                    onClick={() => {setSelectedProvince('all'); setIsFilterOpen(false);}}
                    className={`w-full text-left px-3 py-2 rounded hover:bg-cyber-light-gray transition-colors flex justify-between items-center ${
                      selectedProvince === 'all' ? 'bg-cyber-blue/20 text-cyber-blue' : 'text-white'
                    }`}
                  >
                    <span>所有省份</span>
                      <span className="text-xs text-gray-400">{stats.total}</span>
                  </button>
                  
                  <div className="border-t border-cyber-light-gray my-2"></div>
                  
                    {Object.keys(byProvince).map(province => (
                    <button
                      key={province}
                      onClick={() => {setSelectedProvince(province); setIsFilterOpen(false);}}
                      className={`w-full text-left px-3 py-2 rounded hover:bg-cyber-light-gray transition-colors flex justify-between items-center ${
                        selectedProvince === province ? 'bg-cyber-blue/20 text-cyber-blue' : 'text-white'
                      }`}
                    >
                      <div>
                        <div className="font-medium">{province}</div>
                        <div className="text-xs text-gray-400">{provinceNames[province]}</div>
                      </div>
                      <span className="text-xs text-cyber-green font-bold">
                        {byProvince[province].length}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setIsAddMode(!isAddMode)}
            className="flex items-center gap-2 px-3 py-2 bg-cyber-green/20 hover:bg-cyber-green/30 text-cyber-green rounded-lg transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">添加</span>
          </button>
          
          <button
            onClick={() => setIsBatchMode(!isBatchMode)}
            className="flex items-center gap-2 px-3 py-2 bg-cyber-blue/20 hover:bg-cyber-blue/30 text-cyber-blue rounded-lg transition-colors text-sm"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">批量</span>
        </button>

        <button
          onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors text-sm"
        >
          <Download className="w-4 h-4" />
            <span className="hidden sm:inline">导出</span>
          </button>
          
          <button
            onClick={handleResetToDefault}
            className="flex items-center gap-2 px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">重置</span>
        </button>
        </div>
      </div>

      {/* 快速添加模式 */}
      <AnimatePresence>
        {isAddMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-4 bg-cyber-dark/50 rounded-lg border border-cyber-green/30"
          >
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="输入新的FSA邮编 (如: V6B)"
                value={newFSA}
                onChange={(e) => setNewFSA(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleAddFSA()}
                className="flex-1 px-3 py-2 bg-cyber-dark border border-cyber-light-gray rounded-lg text-white placeholder-gray-400 focus:border-cyber-green focus:outline-none"
              />
              <button
                onClick={handleAddFSA}
                className="px-4 py-2 bg-cyber-green text-white rounded-lg hover:bg-cyber-green/80 transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => {setIsAddMode(false); setNewFSA('');}}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 批量添加模式 */}
      <AnimatePresence>
        {isBatchMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-4 bg-cyber-dark/50 rounded-lg border border-cyber-blue/30"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-cyber-blue">
                <FileSpreadsheet className="w-4 h-4" />
                <span>批量导入FSA（支持逗号、空格、换行分隔，重复项自动覆盖）</span>
              </div>
              <textarea
                placeholder="V6B, M5V, H3G&#10;T2P T5S R3Y&#10;K1A L5B N6C"
                value={batchFSAs}
                onChange={(e) => setBatchFSAs(e.target.value)}
                className="w-full px-3 py-2 bg-cyber-dark border border-cyber-light-gray rounded-lg text-white placeholder-gray-400 focus:border-cyber-blue focus:outline-none resize-none"
                rows={4}
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBatchAdd}
                  className="px-4 py-2 bg-cyber-blue text-white rounded-lg hover:bg-cyber-blue/80 transition-colors flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  批量导入
                </button>
                <button
                  onClick={() => {setIsBatchMode(false); setBatchFSAs('');}}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  取消
                </button>
                <div className="text-xs text-gray-400">
                  {batchFSAs.split(/[,\s\n]+/).filter(f => f.trim()).length} 个待导入
                </div>
              </div>
        </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 按省份分组显示 */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredProvinces.map(province => {
          const provinceFSAs = getFilteredFSAs(province);
          const isExpanded = expandedProvinces.has(province);
          
          return (
            <motion.div
              key={province}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-cyber-dark/30 rounded-lg overflow-hidden"
            >
              {/* 省份标题 */}
              <div 
                className="flex items-center justify-between p-3 bg-cyber-dark/50 cursor-pointer hover:bg-cyber-dark/70 transition-colors"
                onClick={() => toggleProvinceExpansion(province)}
            >
              <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <FolderOpen className="w-4 h-4 text-cyber-blue" />
                    ) : (
                      <Folder className="w-4 h-4 text-gray-400" />
                    )}
                    <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-lg">{province}</span>
                      <span className="text-xs px-2 py-1 bg-cyber-blue/20 text-cyber-blue rounded">
                        {provinceFSAs.length}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">{provinceNames[province]}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-cyber-green font-bold">{provinceFSAs.length} FSA</span>
                  {provinceFSAs.length > 0 && (
                    <button
                      onClick={(e) => {e.stopPropagation(); handleRemoveProvince(province);}}
                      className="p-1 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                      title={`删除${provinceNames[province]}的所有FSA`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* FSA列表 */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-cyber-light-gray/20"
                  >
                    {provinceFSAs.length > 0 ? (
                      <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {provinceFSAs.map(fsa => (
                            <motion.div
                              key={fsa}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex items-center justify-between p-2 bg-cyber-dark/30 rounded border border-cyber-light-gray/20 hover:bg-cyber-dark/50 transition-all"
                            >
                {editingFSA === fsa ? (
                                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                                    className="flex-1 px-2 py-1 bg-cyber-dark border border-cyber-blue rounded text-white focus:outline-none text-sm"
                    autoFocus
                  />
                    <button
                      onClick={handleSaveEdit}
                      className="p-1 text-cyber-green hover:bg-cyber-green/20 rounded transition-colors"
                    >
                                    <Save className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {setEditingFSA(null); setEditValue('');}}
                      className="p-1 text-gray-400 hover:bg-gray-500/20 rounded transition-colors"
                    >
                                    <X className="w-3 h-3" />
                    </button>
                                </div>
                ) : (
                  <>
                                  <span className="text-white font-mono text-sm">{fsa}</span>
                                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditFSA(fsa)}
                      className="p-1 text-cyber-blue hover:bg-cyber-blue/20 rounded transition-colors"
                      title="编辑"
                    >
                                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleRemoveFSA(fsa)}
                      className="p-1 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                      title="删除"
                    >
                                      <Trash2 className="w-3 h-3" />
                    </button>
                                  </div>
                  </>
                )}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-400">
                        <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">该省份暂无FSA数据</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {filteredProvinces.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>没有找到匹配的省份或FSA</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default EnhancedFSAManager; 