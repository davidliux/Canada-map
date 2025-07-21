import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Truck, Zap, Globe, Settings, Bell, User, Database, Download } from 'lucide-react';
import EnhancedSearchPanel from './components/EnhancedSearchPanel';
import EnhancedStatsPanel from './components/EnhancedStatsPanel';
import AccurateFSAMap from './components/AccurateFSAMap';
import { getRegionPostalCodes } from './utils/unifiedStorage.js';
import { dataUpdateNotifier } from './utils/dataUpdateNotifier';
import { recoverLegacyData, checkDataIntegrity } from './utils/dataRecovery';
import './utils/quickSetup.js'; // 加载快速启动脚本
import './utils/demoSetup.js'; // 加载演示设置脚本

import RegionManagementPanel from './components/RegionManagementPanel';
import ImportExportManager from './components/ImportExportManager';
import DataRecoveryNotification from './components/DataRecoveryNotification';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('all');
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [deliverableFSAs, setDeliverableFSAs] = useState([]);
  const [selectedFSA, setSelectedFSA] = useState(null);
  const [showRegionManagement, setShowRegionManagement] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [dataRefreshTrigger, setDataRefreshTrigger] = useState(0);

  useEffect(() => {
    // 系统启动时进行数据恢复检查
    const initializeSystem = async () => {
      console.log('🚀 系统启动中...');

      // 检查数据完整性
      const integrityReport = checkDataIntegrity();
      console.log('📊 数据完整性报告:', integrityReport);

      // 如果数据不完整，尝试恢复
      if (integrityReport.totalFSAs === 0 || integrityReport.regionsWithData === 0) {
        console.log('⚠️ 检测到数据问题，开始恢复...');
        const recoveryResult = recoverLegacyData();
        console.log('🔄 数据恢复结果:', recoveryResult);

        if (recoveryResult.success) {
          // 恢复成功后触发数据刷新
          setDataRefreshTrigger(prev => prev + 1);
        }
      }
    };

    // 模拟系统启动
    const timer = setTimeout(() => {
      initializeSystem().finally(() => {
        setIsLoading(false);
      });
    }, 1500);

    // 监听数据更新通知
    const unsubscribe = dataUpdateNotifier.subscribe((updateInfo) => {
      console.log('App收到数据更新通知:', updateInfo);

      // 触发数据刷新
      setDataRefreshTrigger(prev => prev + 1);

      // 如果是邮编更新，重新计算可配送FSA列表
      if (updateInfo.type === 'regionUpdate' && updateInfo.updateType === 'postalCodes') {
        handleRegionFilter(selectedRegions);
      }
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [selectedRegions]);

  /**
   * 处理FSA分区点击事件
   */
  const handleFSAClick = (fsaData) => {
    setSelectedFSA(fsaData);
    setShowRegionManagement(true);
  };

  /**
   * 关闭区域管理面板
   */
  const handleCloseRegionManagement = () => {
    setShowRegionManagement(false);
    setSelectedFSA(null);
  };

  /**
   * 区域配置变更处理
   */
  const handleRegionConfigChange = (config) => {
    console.log('区域配置已更新:', config);

    // 触发数据刷新，通知其他组件更新
    setDataRefreshTrigger(prev => prev + 1);

    // 如果是邮编变更，更新可配送FSA列表
    if (config && config.postalCodes) {
      // 重新获取所有选中区域的邮编
      handleRegionFilter(selectedRegions);
    }
  };

  /**
   * 处理区域筛选
   */
  const handleRegionFilter = (regions) => {
    console.log('区域筛选更新:', regions);
    setSelectedRegions(regions);

    // 根据选中的区域更新可配送FSA列表
    if (regions.length > 0) {
      const regionFSAs = [];
      regions.forEach(regionId => {
        try {
          // 使用统一存储架构获取区域邮编
          const postalCodes = getRegionPostalCodes(regionId);
          regionFSAs.push(...postalCodes);
        } catch (error) {
          console.error(`读取区域 ${regionId} 邮编数据失败:`, error);
        }
      });
      setDeliverableFSAs(regionFSAs);
    } else {
      // 如果没有选择区域，清空筛选
      setDeliverableFSAs([]);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cyber-dark flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-24 h-24 border-4 border-cyber-blue border-t-transparent rounded-full mx-auto mb-6"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <h2 className="text-3xl font-bold text-cyber-blue mb-4">
            加拿大快递配送系统
          </h2>
          <p className="text-gray-400 text-lg">
            正在启动智能配送区域管理平台<span className="loading-dots"></span>
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyber-green rounded-full animate-pulse"></div>
              <span>系统初始化</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyber-blue rounded-full animate-pulse"></div>
              <span>加载FSA数据</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyber-purple rounded-full animate-pulse"></div>
              <span>连接地图服务</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-dark">
      {/* 增强版顶部导航栏 */}
      <motion.header 
        className="bg-cyber-gray/80 backdrop-blur-md border-b border-cyber-blue/30 sticky top-0 z-50 shadow-lg"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div 
                className="flex items-center gap-3"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="p-3 bg-gradient-to-br from-cyber-blue/20 to-cyber-purple/20 rounded-xl">
                  <Truck className="w-8 h-8 text-cyber-blue" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    加拿大快递配送系统
                  </h1>
                  <p className="text-sm text-gray-400">
                    智能配送区域管理平台 v2.0
                  </p>
                </div>
              </motion.div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* 实时状态指示器 */}
              <motion.div 
                className="flex items-center gap-3 px-4 py-2 bg-cyber-green/20 rounded-xl border border-cyber-green/30"
                animate={{ 
                  boxShadow: [
                    '0 0 5px rgba(16, 185, 129, 0.3)',
                    '0 0 20px rgba(16, 185, 129, 0.6)',
                    '0 0 5px rgba(16, 185, 129, 0.3)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-3 h-3 bg-cyber-green rounded-full animate-pulse"></div>
                <span className="text-cyber-green text-sm font-medium">系统在线</span>
                <span className="text-cyber-green/70 text-xs">99.9%</span>
              </motion.div>
              
              {/* 操作按钮 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRegionManagement(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-gray-400 hover:text-cyber-purple hover:bg-cyber-purple/10"
                  title="配送区域管理"
                >
                  <Database className="w-5 h-5" />
                  <span className="hidden sm:inline text-sm">配送区域管理</span>
                </button>

                <button
                  onClick={() => setShowImportExport(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-gray-400 hover:text-cyber-purple hover:bg-cyber-purple/10"
                  title="导入导出"
                >
                  <Download className="w-5 h-5" />
                  <span className="hidden sm:inline text-sm">导入导出</span>
                </button>

                {/* 数据修复按钮已删除 - 使用统一存储架构，不再需要数据迁移 */}

                <button className="p-2 text-gray-400 hover:text-cyber-blue transition-colors relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyber-blue rounded-full text-xs"></span>
                </button>
                
                <button className="p-2 text-gray-400 hover:text-cyber-blue transition-colors">
                  <User className="w-5 h-5" />
                </button>
                
                <button className="p-2 text-gray-400 hover:text-cyber-blue transition-colors">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto px-6 py-8">
        {/* 增强版统计面板 */}
        <EnhancedStatsPanel />
        

        
        {/* 主要内容区域 */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* 左侧控制面板 */}
          <div className="xl:col-span-4">
            <EnhancedSearchPanel
              onSearch={setSearchQuery}
              onProvinceChange={setSelectedProvince}
              selectedProvince={selectedProvince}
              onRegionFilter={handleRegionFilter}
            />
          </div>

          {/* 右侧地图区域 */}
          <div className="xl:col-span-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-[700px]"
            >
              <AccurateFSAMap
                searchQuery={searchQuery}
                selectedProvince={selectedProvince}
                deliverableFSAs={deliverableFSAs}
                selectedRegions={selectedRegions}
                onFSAClick={handleFSAClick}
                onProvinceChange={setSelectedProvince}
              />
            </motion.div>
          </div>
        </div>

        {/* 区域管理面板 */}
        {showRegionManagement && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="mt-8"
          >
            <RegionManagementPanel
              onClose={handleCloseRegionManagement}
              onConfigChange={handleRegionConfigChange}
            />
          </motion.div>
        )}
      </div>

      {/* 导入导出管理器 */}
      {showImportExport && (
        <ImportExportManager
          onClose={() => setShowImportExport(false)}
          onDataChange={() => {
            // 数据变更后的处理逻辑
            console.log('导入导出数据已变更');
            setDataRefreshTrigger(prev => prev + 1);
          }}
        />
      )}

      {/* 增强版底部状态栏 */}
      <motion.footer 
        className="bg-cyber-gray/50 backdrop-blur-sm border-t border-cyber-blue/30 mt-12"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="container mx-auto px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 系统信息 */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyber-blue/20 rounded-lg">
                <Zap className="w-5 h-5 text-cyber-blue" />
              </div>
              <div>
                <div className="text-white font-medium">系统版本</div>
                <div className="text-gray-400 text-sm">v2.0.0 - 增强版</div>
              </div>
            </div>

            {/* 服务状态 */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyber-green/20 rounded-lg">
                <Globe className="w-5 h-5 text-cyber-green" />
              </div>
              <div>
                <div className="text-white font-medium">服务区域</div>
                <div className="text-gray-400 text-sm">加拿大全境 • 实时覆盖</div>
              </div>
            </div>

            {/* 数据源 */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyber-purple/20 rounded-lg">
                <Settings className="w-5 h-5 text-cyber-purple" />
              </div>
              <div>
                <div className="text-white font-medium">数据源</div>
                <div className="text-gray-400 text-sm">Statistics Canada 2021</div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-cyber-light-gray mt-6 pt-4 text-center">
            <p className="text-gray-400 text-sm">
              © 2024 加拿大快递配送系统. 智能配送区域管理平台 - 保留所有权利.
            </p>
          </div>
        </div>
      </motion.footer>

      {/* 数据恢复通知 */}
      <DataRecoveryNotification />

      {/* 科技风格背景效果 */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* 动态背景圆圈 */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-cyber-blue/3 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-20 w-[500px] h-[500px] bg-cyber-purple/3 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyber-green/3 rounded-full blur-2xl animate-pulse-slow" style={{animationDelay: '2s'}}></div>

        {/* 网格背景 */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>
    </div>
  );
}

export default App; 