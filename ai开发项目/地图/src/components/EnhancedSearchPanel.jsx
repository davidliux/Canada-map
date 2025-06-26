import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  MapPin, 
  Download, 
  Upload, 
  X,
  ChevronDown,
  Settings,
  Tag,
  Database,
  FileText
} from 'lucide-react';
import { getFSAsByProvince } from '../data/deliverableFSA';

const EnhancedSearchPanel = ({ onSearch, onProvinceChange, selectedProvince }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  const [isDataManagementOpen, setIsDataManagementOpen] = useState(false);
  const filterRef = useRef(null);

  const fsasByProvince = getFSAsByProvince();
  const provinces = Object.keys(fsasByProvince).filter(p => fsasByProvince[p].length > 0);

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
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const handleProvinceSelect = (province) => {
    onProvinceChange(province);
    setIsFilterOpen(false);
    
    if (province !== 'all') {
      setActiveFilters(prev => {
        const filtered = prev.filter(f => f.type !== 'province');
        return [...filtered, { type: 'province', value: province, label: provinceNames[province] }];
      });
    } else {
      setActiveFilters(prev => prev.filter(f => f.type !== 'province'));
    }
  };

  const removeFilter = (filterToRemove) => {
    setActiveFilters(prev => prev.filter(f => f !== filterToRemove));
    if (filterToRemove.type === 'province') {
      onProvinceChange('all');
    }
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    onProvinceChange('all');
    setSearchQuery('');
    onSearch('');
  };

  const handleExportData = () => {
    const allFSAs = Object.values(fsasByProvince).flat();
    const csvContent = [
      ['FSA代码', '省份', '省份全名'],
      ...allFSAs.map(fsa => {
        const province = Object.keys(fsasByProvince).find(p => fsasByProvince[p].includes(fsa));
        return [fsa, province, provinceNames[province] || province];
      })
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FSA配送区域数据_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const quickFilters = [
    { label: 'BC省', province: 'BC', count: fsasByProvince.BC?.length || 0 },
    { label: 'ON省', province: 'ON', count: fsasByProvince.ON?.length || 0 },
    { label: 'QC省', province: 'QC', count: fsasByProvince.QC?.length || 0 },
    { label: 'AB省', province: 'AB', count: fsasByProvince.AB?.length || 0 },
    { label: 'MB省', province: 'MB', count: fsasByProvince.MB?.length || 0 }
  ];

  return (
    <motion.div 
      className="bg-cyber-gray border border-cyber-blue/30 rounded-xl p-6 shadow-xl"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* 标题区域 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyber-blue/20 rounded-lg">
            <MapPin className="w-6 h-6 text-cyber-blue" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">配送区域覆盖</h2>
            <p className="text-gray-400 text-sm">查看和管理可配送的区域范围</p>
          </div>
        </div>
        
        <button
          onClick={() => setIsDataManagementOpen(!isDataManagementOpen)}
          className="p-2 text-gray-400 hover:text-cyber-blue transition-colors"
          title="数据管理"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* 搜索栏 */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="搜索邮编、城市或省份..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full pl-12 pr-4 py-3 bg-cyber-dark border border-cyber-light-gray rounded-lg text-white placeholder-gray-400 focus:border-cyber-blue focus:outline-none transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              onSearch('');
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 活动筛选器 */}
      <AnimatePresence>
        {activeFilters.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-gray-400 text-sm">活动筛选:</span>
              {activeFilters.map((filter, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1 bg-cyber-blue/20 text-cyber-blue px-3 py-1 rounded-full text-sm"
                >
                  <Tag className="w-3 h-3" />
                  <span>{filter.label}</span>
                  <button
                    onClick={() => removeFilter(filter)}
                    className="hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
              <button
                onClick={clearAllFilters}
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                清除全部
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 操作按钮 */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* 省份筛选 */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-cyber-light-gray hover:bg-cyber-blue/20 rounded-lg transition-colors text-white"
          >
            <Filter className="w-4 h-4" />
            <span>
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
                className="absolute top-full mt-2 bg-cyber-gray border border-cyber-blue/30 rounded-lg shadow-xl z-50 min-w-64"
              >
                <div className="p-2">
                  <button
                    onClick={() => handleProvinceSelect('all')}
                    className={`w-full text-left px-3 py-2 rounded hover:bg-cyber-light-gray transition-colors flex justify-between items-center ${
                      selectedProvince === 'all' ? 'bg-cyber-blue/20 text-cyber-blue' : 'text-white'
                    }`}
                  >
                    <span>所有省份</span>
                    <span className="text-xs text-gray-400">
                      {Object.values(fsasByProvince).flat().length}
                    </span>
                  </button>
                  
                  <div className="border-t border-cyber-light-gray my-2"></div>
                  
                  {provinces.map(province => (
                    <button
                      key={province}
                      onClick={() => handleProvinceSelect(province)}
                      className={`w-full text-left px-3 py-2 rounded hover:bg-cyber-light-gray transition-colors flex justify-between items-center ${
                        selectedProvince === province ? 'bg-cyber-blue/20 text-cyber-blue' : 'text-white'
                      }`}
                    >
                      <div>
                        <div className="font-medium">{province}</div>
                        <div className="text-xs text-gray-400">{provinceNames[province]}</div>
                      </div>
                      <span className="text-xs text-cyber-green font-bold">
                        {fsasByProvince[province].length}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 导出数据 */}
        <button
          onClick={handleExportData}
          className="flex items-center gap-2 px-4 py-2 bg-cyber-green/20 hover:bg-cyber-green/30 text-cyber-green rounded-lg transition-colors"
          title="导出FSA数据为CSV文件"
        >
          <Download className="w-4 h-4" />
          导出数据
        </button>

        {/* 数据管理 */}
        <button
          className="flex items-center gap-2 px-4 py-2 bg-cyber-purple/20 hover:bg-cyber-purple/30 text-cyber-purple rounded-lg transition-colors"
          title="数据管理功能"
        >
          <Database className="w-4 h-4" />
          数据管理
        </button>
      </div>

      {/* 快速筛选 */}
      <div className="mb-6">
        <h3 className="text-white font-medium mb-2 flex items-center">
          <Tag className="w-4 h-4 mr-2 text-cyber-blue" />
          快速筛选
        </h3>
        <p className="text-xs text-cyber-green mb-3 flex items-center">
          🎯 筛选省份后地图将自动聚焦到对应区域
        </p>
        <div className="flex flex-wrap gap-2">
          {quickFilters.filter(f => f.count > 0).map((filter) => (
            <button
              key={filter.province}
              onClick={() => handleProvinceSelect(filter.province)}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${
                selectedProvince === filter.province
                  ? 'bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/50'
                  : 'bg-cyber-dark text-gray-300 hover:bg-cyber-light-gray border border-cyber-light-gray'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{filter.label}</span>
                <span className="bg-cyber-blue/20 text-cyber-blue px-2 py-1 rounded-full text-xs">
                  {filter.count}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 数据管理面板 */}
      <AnimatePresence>
        {isDataManagementOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-cyber-light-gray pt-4"
          >
            <h3 className="text-white font-medium mb-3 flex items-center">
              <Database className="w-4 h-4 mr-2 text-cyber-blue" />
              数据管理
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center gap-2 px-3 py-2 bg-cyber-light-gray hover:bg-cyber-blue/20 rounded-lg transition-colors text-white">
                <Upload className="w-4 h-4" />
                导入数据
              </button>
              
              <button className="flex items-center gap-2 px-3 py-2 bg-cyber-light-gray hover:bg-cyber-blue/20 rounded-lg transition-colors text-white">
                <FileText className="w-4 h-4" />
                数据报告
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EnhancedSearchPanel; 