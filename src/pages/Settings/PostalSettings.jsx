import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Search, 
  Plus,
  Download,
  Upload,
  Filter,
  Edit2,
  Trash2,
  Package
} from 'lucide-react';
import DirectPostalCodeManager from '../../components/DirectPostalCodeManager';
import { getAllRegionConfigs } from '../../utils/unifiedStorage';

const PostalSettings = () => {
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProvince, setFilterProvince] = useState('all');
  const [postalStats, setPostalStats] = useState({
    totalPostalCodes: 0,
    totalFSAs: 0,
    activePostalCodes: 0,
    provinces: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const configsObj = getAllRegionConfigs();
    const configs = Object.values(configsObj || {});
    setRegions(configs);
    calculateStats(configs);
  };

  const calculateStats = (configs) => {
    const allPostalCodes = new Set();
    const allFSAs = new Set();
    const provinceSet = new Set();

    configs.forEach(region => {
      if (region.postalCodes) {
        region.postalCodes.forEach(code => {
          allPostalCodes.add(code);
          const fsa = code.substring(0, 3);
          allFSAs.add(fsa);
        });
      }
      if (region.fsa) {
        region.fsa.forEach(fsaCode => allFSAs.add(fsaCode));
      }
    });

    setPostalStats({
      totalPostalCodes: allPostalCodes.size,
      totalFSAs: allFSAs.size,
      activePostalCodes: allPostalCodes.size,
      provinces: Array.from(provinceSet),
    });
  };

  const handleImportPostalCodes = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.csv';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedData = JSON.parse(e.target.result);
            // 处理导入的邮编数据
            if (importedData && importedData.regions) {
              import('../../utils/unifiedStorage').then(module => {
                module.saveAllRegionConfigs(importedData.regions);
                loadData();
                alert('邮编数据导入成功！');
              });
            } else {
              alert('导入文件格式不正确，请检查文件内容');
            }
          } catch (error) {
            alert('导入失败：文件格式错误');
            console.error('Import error:', error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleExportPostalCodes = () => {
    const configsObj = getAllRegionConfigs();
    const exportData = {
      exportDate: new Date().toISOString(),
      type: 'postal_codes',
      regions: configsObj,
      stats: postalStats
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `postal-codes-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">邮编管理</h2>
          <p className="mt-1 text-sm text-gray-400">
            管理邮政编码数据和FSA配置
          </p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleExportPostalCodes}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>导出邮编</span>
          </button>
          <button 
            onClick={handleImportPostalCodes}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>导入邮编</span>
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>添加邮编</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-lg p-4 border border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">邮编总数</p>
              <p className="text-2xl font-bold text-white">{postalStats.totalPostalCodes}</p>
            </div>
            <MapPin className="w-8 h-8 text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 rounded-lg p-4 border border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">FSA总数</p>
              <p className="text-2xl font-bold text-white">{postalStats.totalFSAs}</p>
            </div>
            <Package className="w-8 h-8 text-green-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 rounded-lg p-4 border border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">活跃邮编</p>
              <p className="text-2xl font-bold text-white">{postalStats.activePostalCodes}</p>
            </div>
            <MapPin className="w-8 h-8 text-purple-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800 rounded-lg p-4 border border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">覆盖省份</p>
              <p className="text-2xl font-bold text-white">13</p>
            </div>
            <Filter className="w-8 h-8 text-orange-500" />
          </div>
        </motion.div>
      </div>

      {/* Search and Filter */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索邮编或FSA..."
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <select
            value={filterProvince}
            onChange={(e) => setFilterProvince(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">所有省份</option>
            <option value="ON">安大略省</option>
            <option value="QC">魁北克省</option>
            <option value="BC">不列颠哥伦比亚省</option>
            <option value="AB">阿尔伯塔省</option>
            <option value="MB">马尼托巴省</option>
            <option value="SK">萨斯喀彻温省</option>
            <option value="NS">新斯科舍省</option>
            <option value="NB">新不伦瑞克省</option>
            <option value="NL">纽芬兰与拉布拉多省</option>
            <option value="PE">爱德华王子岛省</option>
            <option value="NT">西北地区</option>
            <option value="YT">育空地区</option>
            <option value="NU">努纳武特地区</option>
          </select>
          <select
            value={selectedRegion?.id || ''}
            onChange={(e) => {
              const region = regions.find(r => r.id === e.target.value);
              setSelectedRegion(region);
            }}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">选择区域</option>
            {regions.map(region => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Postal Code Manager */}
      {selectedRegion ? (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">
              {selectedRegion.name} - 邮编管理
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              当前区域包含 {selectedRegion.postalCodes?.length || 0} 个邮编
            </p>
          </div>
          <DirectPostalCodeManager
            selectedRegion={selectedRegion}
            onUpdate={loadData}
          />
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg p-12">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">请选择一个区域来管理邮编</p>
          </div>
        </div>
      )}

      {/* Recent Changes */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">最近更改</h3>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {[
              { action: '添加邮编 M5V 3A8 到 Region 1', time: '5分钟前', type: 'add' },
              { action: '删除邮编 K1A 0B1 从 Region 2', time: '30分钟前', type: 'delete' },
              { action: '批量导入 150 个邮编', time: '2小时前', type: 'import' },
              { action: '更新 Region 3 的FSA配置', time: '昨天', type: 'update' },
            ].map((change, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0"
              >
                <div className="flex items-center space-x-3">
                  {change.type === 'add' && <Plus className="w-4 h-4 text-green-500" />}
                  {change.type === 'delete' && <Trash2 className="w-4 h-4 text-red-500" />}
                  {change.type === 'import' && <Upload className="w-4 h-4 text-blue-500" />}
                  {change.type === 'update' && <Edit2 className="w-4 h-4 text-yellow-500" />}
                  <span className="text-gray-300">{change.action}</span>
                </div>
                <span className="text-gray-500 text-sm">{change.time}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostalSettings;