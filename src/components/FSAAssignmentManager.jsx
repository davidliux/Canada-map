import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  ArrowLeft, 
  Search, 
  Filter, 
  Package, 
  MapPin,
  CheckSquare,
  Square,
  RotateCcw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import {
  getAllRegionConfigs,
  saveAllRegionConfigs
} from '../utils/unifiedStorage.js';
// 注意：FSAAssignmentManager需要重构以使用统一存储架构
// 暂时注释掉getAllFSAConfigs，因为在统一架构中不再需要单独的FSA配置
import { 
  getRegionByFSA, 
  assignFSAToRegion, 
  batchAssignFSAsToRegion, 
  getUnassignedFSAs,
  getRegionDisplayInfo 
} from '../data/regionManagement.js';

/**
 * FSA分配管理器组件
 * 支持拖拽和按钮操作进行FSA分配
 */
const FSAAssignmentManager = ({
  selectedRegion,
  onAssignmentChange,
  onFSASelect,
  className = ''
}) => {
  const [regionConfigs, setRegionConfigs] = useState({});
  const [fsaConfigs, setFSAConfigs] = useState({});
  const [allFSACodes, setAllFSACodes] = useState([]);
  const [unassignedFSAs, setUnassignedFSAs] = useState([]);
  const [selectedFSAs, setSelectedFSAs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProvince, setFilterProvince] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [operationResult, setOperationResult] = useState(null);

  // 加载数据
  useEffect(() => {
    loadAssignmentData();
  }, []);

  // 更新未分配FSA列表
  useEffect(() => {
    if (allFSACodes.length > 0 && Object.keys(regionConfigs).length > 0) {
      const unassigned = getUnassignedFSAs(allFSACodes, regionConfigs);
      setUnassignedFSAs(unassigned);
    }
  }, [allFSACodes, regionConfigs]);



  /**
   * 加载分配数据
   */
  const loadAssignmentData = async () => {
    setIsLoading(true);
    try {
      const regions = getAllRegionConfigs();
      let fsas = getAllFSAConfigs();



      const fsaCodes = Object.keys(fsas);
      console.log('加载的FSA数据:', { fsaCodes, fsas });

      setRegionConfigs(regions);
      setFSAConfigs(fsas);
      setAllFSACodes(fsaCodes);
    } catch (error) {
      console.error('加载分配数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 获取当前区域的FSA列表
   */
  const getCurrentRegionFSAs = () => {
    if (!selectedRegion || !regionConfigs[selectedRegion]) {
      return [];
    }
    return regionConfigs[selectedRegion].fsaCodes || [];
  };

  /**
   * 获取其他区域的FSA列表
   */
  const getOtherRegionFSAs = () => {
    const otherFSAs = [];
    Object.entries(regionConfigs).forEach(([regionId, config]) => {
      if (regionId !== selectedRegion) {
        config.fsaCodes.forEach(fsaCode => {
          otherFSAs.push({
            fsaCode,
            regionId,
            regionName: getRegionDisplayInfo(regionId).name,
            regionColor: getRegionDisplayInfo(regionId).color
          });
        });
      }
    });
    return otherFSAs;
  };

  /**
   * 过滤FSA列表
   */
  const filterFSAs = (fsaList) => {
    return fsaList.filter(item => {
      const fsaCode = typeof item === 'string' ? item : item.fsaCode;
      const fsaConfig = fsaConfigs[fsaCode];
      
      // 搜索过滤
      if (searchQuery && !fsaCode.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // 省份过滤
      if (filterProvince !== 'all' && fsaConfig?.province !== filterProvince) {
        return false;
      }
      
      return true;
    });
  };

  /**
   * 切换FSA选择状态
   */
  const toggleFSASelection = (fsaCode) => {
    setSelectedFSAs(prev => 
      prev.includes(fsaCode) 
        ? prev.filter(code => code !== fsaCode)
        : [...prev, fsaCode]
    );
  };

  /**
   * 全选/取消全选
   */
  const toggleSelectAll = (fsaList) => {
    const fsaCodes = fsaList.map(item => typeof item === 'string' ? item : item.fsaCode);
    const allSelected = fsaCodes.every(code => selectedFSAs.includes(code));
    
    if (allSelected) {
      setSelectedFSAs(prev => prev.filter(code => !fsaCodes.includes(code)));
    } else {
      setSelectedFSAs(prev => [...new Set([...prev, ...fsaCodes])]);
    }
  };

  /**
   * 分配FSA到当前区域
   */
  const assignToCurrentRegion = async (fsaCodes) => {
    if (!selectedRegion || fsaCodes.length === 0) return;

    try {
      const result = batchAssignFSAsToRegion(fsaCodes, selectedRegion, regionConfigs);
      
      if (result.results.success > 0) {
        setRegionConfigs(result.regionConfigs);
        saveAllRegionConfigs(result.regionConfigs);
        
        setOperationResult({
          type: 'success',
          message: `成功分配 ${result.results.success} 个FSA到${getRegionDisplayInfo(selectedRegion).name}`
        });
        
        // 清除选择
        setSelectedFSAs([]);
        
        // 通知父组件
        onAssignmentChange?.(result.regionConfigs);
      }
      
      if (result.results.failed > 0) {
        setOperationResult({
          type: 'warning',
          message: `分配完成，但有 ${result.results.failed} 个FSA分配失败`,
          details: result.results.errors
        });
      }
    } catch (error) {
      setOperationResult({
        type: 'error',
        message: `分配失败: ${error.message}`
      });
    }
  };

  /**
   * 从当前区域移除FSA
   */
  const removeFromCurrentRegion = async (fsaCodes) => {
    if (!selectedRegion || fsaCodes.length === 0) return;

    try {
      let updatedConfigs = { ...regionConfigs };
      
      fsaCodes.forEach(fsaCode => {
        updatedConfigs = assignFSAToRegion(fsaCode, selectedRegion, null, updatedConfigs);
      });
      
      setRegionConfigs(updatedConfigs);
      saveAllRegionConfigs(updatedConfigs);
      
      setOperationResult({
        type: 'success',
        message: `成功从${getRegionDisplayInfo(selectedRegion).name}移除 ${fsaCodes.length} 个FSA`
      });
      
      // 清除选择
      setSelectedFSAs([]);
      
      // 通知父组件
      onAssignmentChange?.(updatedConfigs);
    } catch (error) {
      setOperationResult({
        type: 'error',
        message: `移除失败: ${error.message}`
      });
    }
  };

  // 获取省份列表
  const getProvinces = () => {
    const provinces = new Set();
    Object.values(fsaConfigs).forEach(config => {
      if (config.province) {
        provinces.add(config.province);
      }
    });
    return Array.from(provinces).sort();
  };

  if (isLoading) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="animate-spin w-8 h-8 border-2 border-cyber-blue border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-300">加载FSA分配数据...</p>
      </div>
    );
  }

  if (!selectedRegion) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-300 mb-2">选择配送区域</h3>
        <p className="text-gray-400">请先选择一个配送区域来管理FSA分配</p>
      </div>
    );
  }

  const currentRegionFSAs = filterFSAs(getCurrentRegionFSAs());
  const otherRegionFSAs = filterFSAs(getOtherRegionFSAs());
  const unassignedFiltered = filterFSAs(unassignedFSAs);
  const selectedRegionInfo = getRegionDisplayInfo(selectedRegion);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 标题和操作结果 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyber-blue/20 rounded-lg">
            <Package className="w-5 h-5 text-cyber-blue" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">FSA分配管理</h3>
            <p className="text-gray-400 text-sm">
              当前区域：<span style={{ color: selectedRegionInfo.color }}>{selectedRegionInfo.name}</span>
              <span className="ml-2 text-blue-300">💡 双击FSA进入邮编管理</span>
            </p>
          </div>
        </div>

        {selectedFSAs.length > 0 && (
          <div className="text-sm text-cyber-blue">
            已选择 {selectedFSAs.length} 个FSA
          </div>
        )}
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
                operationResult.type === 'success' ? 'text-green-300' : 'text-red-300'
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

      {/* 搜索和过滤 */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索FSA代码..."
            className="w-full pl-10 pr-4 py-2 bg-cyber-gray/50 border border-cyber-blue/30 rounded-lg text-white placeholder-gray-400"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={filterProvince}
            onChange={(e) => setFilterProvince(e.target.value)}
            className="pl-10 pr-8 py-2 bg-cyber-gray/50 border border-cyber-blue/30 rounded-lg text-white appearance-none"
          >
            <option value="all">所有省份</option>
            {getProvinces().map(province => (
              <option key={province} value={province}>{province}</option>
            ))}
          </select>
        </div>
      </div>

      {/* FSA分配界面 */}
      <div className="grid grid-cols-12 gap-6">
        {/* 左侧：当前区域FSA */}
        <div className="col-span-5">
          <FSAListPanel
            title={`${selectedRegionInfo.name} (${currentRegionFSAs.length})`}
            titleColor={selectedRegionInfo.color}
            fsaList={currentRegionFSAs}
            fsaConfigs={fsaConfigs}
            selectedFSAs={selectedFSAs}
            onToggleSelection={toggleFSASelection}
            onToggleSelectAll={() => toggleSelectAll(currentRegionFSAs)}
            onFSASelect={onFSASelect}
            showRemoveButton={true}
            onRemove={() => removeFromCurrentRegion(selectedFSAs.filter(code => currentRegionFSAs.includes(code)))}
          />
        </div>

        {/* 中间：操作按钮 */}
        <div className="col-span-2 flex flex-col items-center justify-center space-y-4">
          <button
            onClick={() => assignToCurrentRegion(selectedFSAs.filter(code => 
              [...otherRegionFSAs.map(item => item.fsaCode), ...unassignedFiltered].includes(code)
            ))}
            disabled={selectedFSAs.length === 0}
            className="p-3 bg-cyber-blue/20 hover:bg-cyber-blue/30 border border-cyber-blue/30 rounded-lg text-cyber-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="分配到当前区域"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => removeFromCurrentRegion(selectedFSAs.filter(code => currentRegionFSAs.includes(code)))}
            disabled={selectedFSAs.length === 0}
            className="p-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="从当前区域移除"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setSelectedFSAs([])}
            disabled={selectedFSAs.length === 0}
            className="p-2 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/30 rounded-lg text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="清除选择"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* 右侧：其他区域和未分配FSA */}
        <div className="col-span-5 space-y-4">
          {/* 未分配FSA */}
          <FSAListPanel
            title={`未分配 (${unassignedFiltered.length})`}
            titleColor="#F59E0B"
            fsaList={unassignedFiltered}
            fsaConfigs={fsaConfigs}
            selectedFSAs={selectedFSAs}
            onToggleSelection={toggleFSASelection}
            onToggleSelectAll={() => toggleSelectAll(unassignedFiltered)}
            onFSASelect={onFSASelect}
            maxHeight="200px"
          />

          {/* 其他区域FSA */}
          <FSAListPanel
            title={`其他区域 (${otherRegionFSAs.length})`}
            titleColor="#6B7280"
            fsaList={otherRegionFSAs}
            fsaConfigs={fsaConfigs}
            selectedFSAs={selectedFSAs}
            onToggleSelection={toggleFSASelection}
            onToggleSelectAll={() => toggleSelectAll(otherRegionFSAs)}
            onFSASelect={onFSASelect}
            showRegionInfo={true}
            maxHeight="300px"
          />
        </div>
      </div>
    </div>
  );
};

/**
 * FSA列表面板组件
 */
const FSAListPanel = ({
  title,
  titleColor,
  fsaList,
  fsaConfigs,
  selectedFSAs,
  onToggleSelection,
  onToggleSelectAll,
  onFSASelect,
  showRemoveButton = false,
  showRegionInfo = false,
  onRemove,
  maxHeight = '400px'
}) => {
  const allSelected = fsaList.length > 0 && fsaList.every(item => {
    const fsaCode = typeof item === 'string' ? item : item.fsaCode;
    return selectedFSAs.includes(fsaCode);
  });

  return (
    <div className="bg-cyber-gray/20 border border-cyber-blue/20 rounded-lg">
      {/* 标题栏 */}
      <div className="p-4 border-b border-cyber-blue/20">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-white flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: titleColor }}
            />
            {title}
          </h4>
          
          <div className="flex items-center gap-2">
            {fsaList.length > 0 && (
              <button
                onClick={onToggleSelectAll}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title={allSelected ? "取消全选" : "全选"}
              >
                {allSelected ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>
            )}
            
            {showRemoveButton && selectedFSAs.length > 0 && (
              <button
                onClick={onRemove}
                className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded text-red-300 text-xs transition-colors"
              >
                移除选中
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FSA列表 */}
      <div className="p-2" style={{ maxHeight, overflowY: 'auto' }}>
        {fsaList.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">暂无FSA</p>
          </div>
        ) : (
          <div className="space-y-1">
            {fsaList.map((item, index) => {
              const fsaCode = typeof item === 'string' ? item : item.fsaCode;
              const fsaConfig = fsaConfigs[fsaCode];
              const isSelected = selectedFSAs.includes(fsaCode);
              
              return (
                <motion.div
                  key={fsaCode}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={`p-2 rounded border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyber-blue/20 border-cyber-blue/30'
                      : 'bg-cyber-gray/10 border-gray-600/30 hover:border-gray-500/50'
                  }`}
                  onClick={(e) => {
                    // 防止双击时触发单击事件
                    if (e.detail === 1) {
                      setTimeout(() => {
                        if (e.detail === 1) {
                          onToggleSelection(fsaCode);
                        }
                      }, 200);
                    }
                  }}
                  onDoubleClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('FSA双击事件:', fsaCode);
                    onFSASelect?.(fsaCode);
                  }}
                  title="单击选择，双击管理邮编"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-cyber-blue" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="font-mono text-white">{fsaCode}</span>
                      {fsaConfig?.province && (
                        <span className="text-xs text-gray-400">({fsaConfig.province})</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {showRegionInfo && typeof item === 'object' && (
                        <div className="flex items-center gap-1">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: item.regionColor }}
                          />
                          <span className="text-xs text-gray-400">{item.regionName}</span>
                        </div>
                      )}

                      {/* 邮编管理按钮 */}
                      {onFSASelect && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('邮编管理按钮点击:', fsaCode);
                            onFSASelect(fsaCode);
                          }}
                          className="px-2 py-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded text-green-300 text-xs transition-colors"
                          title="管理邮编"
                        >
                          邮编
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FSAAssignmentManager;
