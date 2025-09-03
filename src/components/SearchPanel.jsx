import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, MapPin, Package2, Download, Upload } from 'lucide-react';
import { getPostalCodesByProvince } from '../data/postalCodes';

const SearchPanel = ({ onSearch, onProvinceChange, selectedProvince }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const provinceGroups = getPostalCodesByProvince();
  const provinces = Object.keys(provinceGroups);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const handleProvinceChange = (province) => {
    onProvinceChange(province);
    setIsFilterOpen(false);
  };

  const handleExportData = () => {
    // 导出当前邮编数据为CSV
    const csvContent = [
      ['邮编', '城市', '省份', '纬度', '经度'],
      ...Object.values(provinceGroups).flat().map(code => [
        code.postalCode,
        code.city,
        code.province,
        code.lat,
        code.lng
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `delivery-postal-codes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getProvinceDisplayName = (code) => {
    const provinceNames = {
      'ON': '安大略省',
      'QC': '魁北克省',
      'BC': '不列颠哥伦比亚省',
      'AB': '阿尔伯塔省',
      'SK': '萨斯喀彻温省',
      'MB': '马尼托巴省',
      'NS': '新斯科舍省',
      'NB': '新不伦瑞克省',
      'PE': '爱德华王子岛省',
      'NL': '纽芬兰和拉布拉多省',
      'YT': '育空地区',
      'NT': '西北地区',
      'NU': '努纳武特地区'
    };
    return provinceNames[code] || code;
  };

  return (
    <motion.div 
      className="bg-cyber-gray border border-cyber-light-gray rounded-xl p-6 shadow-lg"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* 标题 */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-cyber-blue/20 rounded-lg">
          <MapPin className="w-6 h-6 text-cyber-blue" />
        </div>
        <div>
          <h2 className="text-xl font-bold">配送区域覆盖</h2>
          <p className="text-gray-400 text-sm">查看和管理可配送的区域范围</p>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="搜索邮编、城市或省份..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="cyber-input w-full pl-12 pr-4"
        />
      </div>

      {/* 筛选和操作按钮 */}
      <div className="flex flex-wrap gap-3 mb-4">
        {/* 省份筛选 */}
        <div className="relative">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="cyber-button flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {selectedProvince === 'all' ? '所有省份' : getProvinceDisplayName(selectedProvince)}
          </button>
          
          {isFilterOpen && (
            <motion.div
              className="absolute top-full mt-2 bg-cyber-gray border border-cyber-light-gray rounded-lg shadow-xl z-50 min-w-48"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="p-2">
                <button
                  onClick={() => handleProvinceChange('all')}
                  className={`w-full text-left px-3 py-2 rounded hover:bg-cyber-light-gray transition-colors ${
                    selectedProvince === 'all' ? 'bg-cyber-blue/20 text-cyber-blue' : ''
                  }`}
                >
                  所有省份 ({Object.values(provinceGroups).flat().length})
                </button>
                {provinces.map(province => (
                  <button
                    key={province}
                    onClick={() => handleProvinceChange(province)}
                    className={`w-full text-left px-3 py-2 rounded hover:bg-cyber-light-gray transition-colors flex justify-between items-center ${
                      selectedProvince === province ? 'bg-cyber-blue/20 text-cyber-blue' : ''
                    }`}
                  >
                    <span>{getProvinceDisplayName(province)}</span>
                    <span className="text-xs text-gray-400">
                      {provinceGroups[province].length}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* 导出数据 */}
        <button
          onClick={handleExportData}
          className="cyber-button flex items-center gap-2"
          title="导出邮编数据为CSV文件"
        >
          <Download className="w-4 h-4" />
          导出数据
        </button>

        {/* 数据管理按钮 */}
        <button
          className="cyber-button flex items-center gap-2"
          title="管理邮编数据"
        >
          <Upload className="w-4 h-4" />
          数据管理
        </button>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-cyber-light-gray rounded-lg p-4 text-center">
          <Package2 className="w-6 h-6 text-cyber-blue mx-auto mb-2" />
          <div className="text-2xl font-bold text-cyber-blue">
            {Object.values(provinceGroups).flat().length}
          </div>
          <div className="text-xs text-gray-400">配送区域</div>
        </div>
        
        <div className="bg-cyber-light-gray rounded-lg p-4 text-center">
          <MapPin className="w-6 h-6 text-cyber-green mx-auto mb-2" />
          <div className="text-2xl font-bold text-cyber-green">
            {provinces.length}
          </div>
          <div className="text-xs text-gray-400">覆盖省份</div>
        </div>

        <div className="bg-cyber-light-gray rounded-lg p-4 text-center">
          <div className="w-6 h-6 text-cyber-purple mx-auto mb-2 flex items-center justify-center font-bold text-lg">
            %
          </div>
          <div className="text-2xl font-bold text-cyber-purple">
            {Math.round((provinces.length / 13) * 100)}
          </div>
          <div className="text-xs text-gray-400">覆盖率</div>
        </div>

        <div className="bg-cyber-light-gray rounded-lg p-4 text-center">
          <div className="w-6 h-6 text-yellow-400 mx-auto mb-2 flex items-center justify-center">
            <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
          </div>
          <div className="text-2xl font-bold text-yellow-400">
            在线
          </div>
          <div className="text-xs text-gray-400">系统状态</div>
        </div>
      </div>

      {/* 快速筛选标签 */}
      <div className="mt-4 pt-4 border-t border-cyber-light-gray">
        <div className="text-sm text-gray-400 mb-2">快速筛选:</div>
        <div className="flex flex-wrap gap-2">
          {provinces.slice(0, 5).map(province => (
            <button
              key={province}
              onClick={() => handleProvinceChange(province)}
              className={`px-3 py-1 rounded-full text-xs border transition-all ${
                selectedProvince === province
                  ? 'border-cyber-blue bg-cyber-blue/20 text-cyber-blue'
                  : 'border-cyber-light-gray text-gray-400 hover:border-cyber-blue hover:text-cyber-blue'
              }`}
            >
              {getProvinceDisplayName(province)} ({provinceGroups[province].length})
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default SearchPanel; 