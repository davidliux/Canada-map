import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Map,
  MapPin,
  Package,
  Settings
} from 'lucide-react';
import RegionManagementPanel from '../../components/RegionManagementPanel';
import { getAllRegionConfigs } from '../../utils/unifiedStorage';

const RegionSettings = () => {
  const [regions, setRegions] = useState([]);
  const [showRegionPanel, setShowRegionPanel] = useState(true);

  useEffect(() => {
    loadRegions();
  }, []);

  const loadRegions = () => {
    const configsObj = getAllRegionConfigs();
    const configs = Object.values(configsObj || {}).map(config => ({
      ...config,
      id: config.id || Math.random().toString(36).substr(2, 9)
    }));
    setRegions(configs);
  };

  const handleConfigChange = () => {
    loadRegions(); // 重新加载数据以更新统计
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <Map className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  区域管理
                </h1>
                <p className="mt-1 text-gray-300">
                  管理1-8区配送区域的FSA分配和价格配置
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 区域管理面板 */}
        {showRegionPanel && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <RegionManagementPanel
              onClose={() => setShowRegionPanel(false)}
              onConfigChange={handleConfigChange}
              className="w-full max-w-none"
            />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default RegionSettings;