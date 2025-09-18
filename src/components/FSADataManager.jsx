import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Search,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Globe,
  Package,
  TrendingUp
} from 'lucide-react';

import {
  getEnhancedFSAData,
  getFSACoverageStats,
  searchFSA,
  groupFSAByProvince
} from '../utils/mergeFSAData';
import { provinceNames } from '../data/canadaFSAData';

/**
 * FSA数据管理组件
 * 用于查看、搜索和管理加拿大所有FSA数据
 */
const FSADataManager = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('all');
  const [showOnlyDeliverable, setShowOnlyDeliverable] = useState(false);
  const [coverageStats, setCoverageStats] = useState(null);
  const [fsaData, setFsaData] = useState([]);
  const [loading, setLoading] = useState(true);

  // 初始化数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const stats = getFSACoverageStats();
      const data = getEnhancedFSAData();
      setCoverageStats(stats);
      setFsaData(data);
    } catch (error) {
      console.error('加载FSA数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 过滤数据
  const filteredData = useMemo(() => {
    let result = [...fsaData];

    // 按省份过滤
    if (selectedProvince !== 'all') {
      result = result.filter(item => item.province === selectedProvince);
    }

    // 按配送状态过滤
    if (showOnlyDeliverable) {
      result = result.filter(item => item.isDeliverable);
    }

    // 按搜索关键词过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.fsa.toLowerCase().includes(query) ||
        item.city.toLowerCase().includes(query) ||
        item.province.toLowerCase().includes(query)
      );
    }

    return result;
  }, [fsaData, selectedProvince, showOnlyDeliverable, searchQuery]);

  // 省份分组数据
  const groupedData = useMemo(() => {
    return groupFSAByProvince();
  }, [fsaData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      {/* 标题和统计 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Globe className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-2xl font-bold text-white">FSA数据管理中心</h1>
              <p className="text-gray-400">完整的加拿大邮政编码前缀数据</p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2"
          >
            <TrendingUp className="w-4 h-4" />
            <span>刷新数据</span>
          </motion.button>
        </div>

        {/* 覆盖率统计卡片 */}
        {coverageStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 rounded-lg p-4 border border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">总FSA数量</span>
                <Globe className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white">{coverageStats.total}</div>
              <div className="text-xs text-gray-500 mt-1">全加拿大</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800 rounded-lg p-4 border border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">可配送FSA</span>
                <CheckCircle className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-green-400">{coverageStats.deliverable}</div>
              <div className="text-xs text-gray-500 mt-1">已覆盖区域</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800 rounded-lg p-4 border border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">未覆盖FSA</span>
                <XCircle className="w-4 h-4 text-red-400" />
              </div>
              <div className="text-2xl font-bold text-red-400">{coverageStats.missing}</div>
              <div className="text-xs text-gray-500 mt-1">待扩展区域</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-800 rounded-lg p-4 border border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">覆盖率</span>
                <Package className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-purple-400">{coverageStats.coverageRate}</div>
              <div className="text-xs text-gray-500 mt-1">配送覆盖率</div>
            </motion.div>
          </div>
        )}
      </div>

      {/* 搜索和过滤栏 */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 搜索框 */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索FSA代码、城市或省份..."
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* 省份选择 */}
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">所有省份</option>
            {Object.entries(provinceNames).map(([code, name]) => (
              <option key={code} value={code}>
                {name} ({code})
              </option>
            ))}
          </select>

          {/* 配送状态过滤 */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyDeliverable}
              onChange={(e) => setShowOnlyDeliverable(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <span className="text-white">仅显示可配送区域</span>
          </label>
        </div>

        {/* 结果统计 */}
        <div className="text-sm text-gray-400">
          找到 {filteredData.length} 个FSA
          {searchQuery && ` (搜索: "${searchQuery}")`}
          {selectedProvince !== 'all' && ` (省份: ${selectedProvince})`}
          {showOnlyDeliverable && ' (仅可配送)'}
        </div>
      </div>

      {/* FSA数据列表 */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  FSA代码
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  省份
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  城市
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  坐标
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  状态
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredData.slice(0, 100).map((item) => (
                <motion.tr
                  key={item.fsa}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-750 transition-colors"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-white font-medium">{item.fsa}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-gray-300">{item.province}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-gray-300">{item.city}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-gray-400 text-sm">
                      {item.lat}, {item.lng}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {item.isDeliverable ? (
                      <span className="flex items-center space-x-1 text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span>可配送</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-gray-500">
                        <XCircle className="w-4 h-4" />
                        <span>未覆盖</span>
                      </span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredData.length > 100 && (
          <div className="px-4 py-3 bg-gray-900 border-t border-gray-700 text-center text-sm text-gray-400">
            显示前100条记录，共 {filteredData.length} 条
          </div>
        )}
      </div>

      {/* 省份覆盖率详情 */}
      {coverageStats && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-white mb-4">各省份覆盖情况</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(coverageStats.provinceStats).map(([province, stats]) => (
              <motion.div
                key={province}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-800 rounded-lg p-4 border border-gray-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">
                    {provinceNames[province] || province}
                  </span>
                  <span className="text-xs text-gray-400">{province}</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">总数:</span>
                    <span className="text-white">{stats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">已覆盖:</span>
                    <span className="text-green-400">{stats.deliverable}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">未覆盖:</span>
                    <span className="text-red-400">{stats.missing}</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-gray-700">
                    <div className="flex justify-between">
                      <span className="text-gray-400">覆盖率:</span>
                      <span className="text-purple-400">
                        {stats.total > 0 ? ((stats.deliverable / stats.total) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FSADataManager;