import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  Copy, 
  Save, 
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Download,
  Upload,
  Settings,
  History,
  Calculator,
  FileSpreadsheet
} from 'lucide-react';
import TruckPriceTable from './TruckPriceTable';
import { 
  getAllPriceTables,
  savePriceTable,
  batchUpdatePriceTables,
  deletePriceTable,
  getPriceHistory,
  exportPriceData,
  importPriceData,
  createDefaultPriceTable
} from '../../utils/storage/truckPriceStorage';
import { validateRegionPriceTable } from '../../types/truckDelivery';

/**
 * 卡车配送区域价格管理器
 * 专门管理货车配送的价格配置
 */
const RegionPriceManager = ({ 
  selectedRegion,
  regionList = [],
  onPriceUpdate,
  className = '' 
}) => {
  const [priceTables, setPriceTables] = useState({});
  const [currentTable, setCurrentTable] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [operationResult, setOperationResult] = useState(null);
  const [showBatchOperations, setShowBatchOperations] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  
  // 批量操作设置
  const [batchSettings, setBatchSettings] = useState({
    sourceRegion: '',
    adjustmentPercentage: 0,
    selectedRegions: new Set(),
    operation: 'copy' // copy, adjust, export, import
  });

  // 导入导出状态
  const [importData, setImportData] = useState(null);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // 加载价格表数据
  const loadPriceTables = useCallback(async () => {
    setIsLoading(true);
    try {
      const tables = getAllPriceTables();
      setPriceTables(tables);
      
      // 如果选中了区域但没有价格表，创建默认的
      if (selectedRegion && !tables[selectedRegion.id]) {
        const defaultTable = createDefaultPriceTable(
          selectedRegion.id, 
          selectedRegion.name
        );
        tables[selectedRegion.id] = defaultTable;
        savePriceTable(selectedRegion.id, defaultTable);
        setPriceTables(tables);
      }
      
      // 更新当前表格
      if (selectedRegion && tables[selectedRegion.id]) {
        setCurrentTable(tables[selectedRegion.id]);
      }
      
    } catch (error) {
      console.error('加载价格表失败:', error);
      showOperationResult('加载价格表失败', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedRegion]);

  // 显示操作结果
  const showOperationResult = (message, type = 'success') => {
    setOperationResult({ message, type });
    setTimeout(() => setOperationResult(null), 3000);
  };

  // 保存价格表
  const handleSavePriceTable = async (priceTable) => {
    if (!selectedRegion) return;
    
    try {
      const success = savePriceTable(selectedRegion.id, {
        ...priceTable,
        regionName: selectedRegion.name,
        isActive: true,
        lastUpdated: new Date().toISOString()
      });
      
      if (success) {
        await loadPriceTables();
        showOperationResult(`区域 ${selectedRegion.name} 价格保存成功`);
        
        if (onPriceUpdate) {
          onPriceUpdate(selectedRegion.id, priceTable);
        }
      } else {
        showOperationResult('价格保存失败，请检查数据格式', 'error');
      }
    } catch (error) {
      console.error('保存价格失败:', error);
      showOperationResult('保存价格时发生错误', 'error');
    }
  };

  // 复制价格配置
  const copyPriceConfig = async (sourceRegionId, targetRegionIds) => {
    if (!sourceRegionId || targetRegionIds.length === 0) return;
    
    try {
      const sourceTable = priceTables[sourceRegionId];
      if (!sourceTable) {
        showOperationResult('源区域价格配置不存在', 'error');
        return;
      }

      const updateTables = {};
      targetRegionIds.forEach(targetId => {
        const targetRegion = regionList.find(r => r.id === targetId);
        if (targetRegion) {
          updateTables[targetId] = {
            ...sourceTable,
            regionId: targetId,
            regionName: targetRegion.name,
            lastUpdated: new Date().toISOString()
          };
        }
      });

      const result = batchUpdatePriceTables(updateTables);
      if (result.summary.successCount > 0) {
        await loadPriceTables();
        showOperationResult(
          `成功复制价格配置到 ${result.summary.successCount} 个区域`
        );
      } else {
        showOperationResult('价格配置复制失败', 'error');
      }
      
    } catch (error) {
      console.error('复制价格配置失败:', error);
      showOperationResult('复制价格配置时发生错误', 'error');
    }
  };

  // 调整价格
  const adjustPrices = async (regionIds, percentage) => {
    if (regionIds.length === 0 || percentage === 0) return;
    
    try {
      const updateTables = {};
      regionIds.forEach(regionId => {
        const table = priceTables[regionId];
        if (table) {
          const adjustedPrices = table.weightRanges.map(range => ({
            ...range,
            price: Math.round(range.price * (1 + percentage / 100) * 100) / 100
          }));
          
          updateTables[regionId] = {
            ...table,
            weightRanges: adjustedPrices,
            lastUpdated: new Date().toISOString()
          };
        }
      });

      const result = batchUpdatePriceTables(updateTables);
      if (result.summary.successCount > 0) {
        await loadPriceTables();
        showOperationResult(
          `成功调整 ${result.summary.successCount} 个区域的价格 ${percentage > 0 ? '+' : ''}${percentage}%`
        );
      } else {
        showOperationResult('价格调整失败', 'error');
      }
      
    } catch (error) {
      console.error('调整价格失败:', error);
      showOperationResult('调整价格时发生错误', 'error');
    }
  };

  // 导出价格数据
  const handleExportData = () => {
    try {
      const regionIds = Array.from(batchSettings.selectedRegions);
      const exportData = exportPriceData(regionIds.length > 0 ? regionIds : undefined);
      
      if (exportData) {
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `truck-prices-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showOperationResult('价格数据导出成功');
      } else {
        showOperationResult('导出数据失败', 'error');
      }
    } catch (error) {
      console.error('导出失败:', error);
      showOperationResult('导出数据时发生错误', 'error');
    }
  };

  // 导入价格数据
  const handleImportData = async (file) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      const result = importPriceData(data, true); // 覆盖现有数据
      if (result.summary.successCount > 0) {
        await loadPriceTables();
        showOperationResult(
          `成功导入 ${result.summary.successCount} 个区域的价格配置`
        );
      } else {
        showOperationResult('导入数据失败', 'error');
      }
      
      setShowImportDialog(false);
    } catch (error) {
      console.error('导入失败:', error);
      showOperationResult('导入数据时发生错误', 'error');
    }
  };

  // 加载历史记录
  const loadHistory = async (regionId) => {
    try {
      const history = getPriceHistory(regionId, 20);
      setHistoryData(history);
      setShowHistory(true);
    } catch (error) {
      console.error('加载历史记录失败:', error);
      showOperationResult('加载历史记录失败', 'error');
    }
  };

  // 生命周期
  useEffect(() => {
    loadPriceTables();
  }, [loadPriceTables]);

  // 计算整体统计
  const getOverallStats = () => {
    const regionIds = Object.keys(priceTables);
    let totalRanges = 0;
    let activeRanges = 0;
    let totalPrice = 0;
    let activeRegions = 0;

    regionIds.forEach(id => {
      const table = priceTables[id];
      if (table?.isActive) {
        activeRegions++;
        if (table.weightRanges) {
          table.weightRanges.forEach(range => {
            totalRanges++;
            if (range.isActive && range.price > 0) {
              activeRanges++;
              totalPrice += range.price;
            }
          });
        }
      }
    });

    return {
      totalRegions: regionIds.length,
      activeRegions,
      totalRanges,
      activeRanges,
      totalPrice,
      avgPrice: activeRanges > 0 ? Math.round(totalPrice / activeRanges * 100) / 100 : 0
    };
  };

  const stats = getOverallStats();

  if (isLoading) {
    return (
      <div className={`bg-gray-900 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-300">加载价格配置...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 rounded-lg border border-gray-700 ${className}`}>
      {/* 标题栏 */}
      <div className="border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">货车配送价格管理</h2>
              <p className="text-sm text-gray-400">
                {selectedRegion 
                  ? `当前区域: ${selectedRegion.name}` 
                  : '请选择区域进行价格配置'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {selectedRegion && (
              <>
                <button
                  onClick={() => loadHistory(selectedRegion.id)}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white 
                           rounded-md transition-colors text-sm flex items-center space-x-1"
                >
                  <History className="w-4 h-4" />
                  <span>历史</span>
                </button>
                
                <button
                  onClick={() => setShowBatchOperations(!showBatchOperations)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white 
                           rounded-md transition-colors text-sm flex items-center space-x-1"
                >
                  <Settings className="w-4 h-4" />
                  <span>批量操作</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 整体统计信息 */}
        <div className="mt-4 grid grid-cols-6 gap-4 text-sm">
          <div className="text-center">
            <div className="text-white font-medium">{stats.totalRegions}</div>
            <div className="text-gray-400">总区域</div>
          </div>
          <div className="text-center">
            <div className="text-white font-medium">{stats.activeRegions}</div>
            <div className="text-gray-400">已配置</div>
          </div>
          <div className="text-center">
            <div className="text-white font-medium">{stats.totalRanges}</div>
            <div className="text-gray-400">价格项</div>
          </div>
          <div className="text-center">
            <div className="text-white font-medium">{stats.activeRanges}</div>
            <div className="text-gray-400">已定价</div>
          </div>
          <div className="text-center">
            <div className="text-white font-medium">${stats.avgPrice}</div>
            <div className="text-gray-400">平均价格</div>
          </div>
          <div className="text-center">
            <div className="text-white font-medium">${stats.totalPrice.toFixed(2)}</div>
            <div className="text-gray-400">总价格</div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="p-4">
        {selectedRegion ? (
          <>
            {/* 价格表组件 */}
            <TruckPriceTable
              regionId={selectedRegion.id}
              regionName={selectedRegion.name}
              priceTable={currentTable}
              onChange={handleSavePriceTable}
              showValidation={true}
              allowBatchOperations={true}
            />

            {/* 批量操作面板 */}
            <AnimatePresence>
              {showBatchOperations && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 bg-gray-800 rounded-lg border border-gray-600 p-4"
                >
                  <h3 className="text-lg font-semibold text-white mb-4">批量操作</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 复制价格配置 */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-white">复制价格配置</h4>
                      <select
                        value={batchSettings.sourceRegion}
                        onChange={(e) => setBatchSettings(prev => ({
                          ...prev,
                          sourceRegion: e.target.value
                        }))}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md 
                                 text-white p-2 text-sm"
                      >
                        <option value="">选择源区域</option>
                        {regionList.map(region => (
                          <option key={region.id} value={region.id}>
                            {region.name}
                          </option>
                        ))}
                      </select>
                      
                      <button
                        onClick={() => {
                          const targetIds = Array.from(batchSettings.selectedRegions);
                          if (batchSettings.sourceRegion && targetIds.length > 0) {
                            copyPriceConfig(batchSettings.sourceRegion, targetIds);
                          }
                        }}
                        disabled={!batchSettings.sourceRegion || batchSettings.selectedRegions.size === 0}
                        className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 
                                 disabled:bg-gray-600 text-white rounded-md transition-colors text-sm"
                      >
                        <Copy className="w-4 h-4 inline mr-2" />
                        复制到选中区域
                      </button>
                    </div>

                    {/* 价格调整 */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-white">价格调整</h4>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          value={batchSettings.adjustmentPercentage}
                          onChange={(e) => setBatchSettings(prev => ({
                            ...prev,
                            adjustmentPercentage: parseFloat(e.target.value) || 0
                          }))}
                          className="flex-1 bg-gray-700 border border-gray-600 rounded-md 
                                   text-white p-2 text-sm"
                          placeholder="调整百分比"
                        />
                        <span className="text-gray-400 self-center">%</span>
                      </div>
                      
                      <button
                        onClick={() => {
                          const regionIds = Array.from(batchSettings.selectedRegions);
                          if (regionIds.length > 0 && batchSettings.adjustmentPercentage !== 0) {
                            adjustPrices(regionIds, batchSettings.adjustmentPercentage);
                          }
                        }}
                        disabled={batchSettings.selectedRegions.size === 0 || batchSettings.adjustmentPercentage === 0}
                        className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 
                                 disabled:bg-gray-600 text-white rounded-md transition-colors text-sm"
                      >
                        {batchSettings.adjustmentPercentage > 0 ? (
                          <TrendingUp className="w-4 h-4 inline mr-2" />
                        ) : (
                          <TrendingDown className="w-4 h-4 inline mr-2" />
                        )}
                        调整价格
                      </button>
                    </div>
                  </div>

                  {/* 区域选择 */}
                  <div className="mt-4">
                    <h4 className="font-medium text-white mb-2">目标区域选择</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                      {regionList.map(region => (
                        <label key={region.id} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={batchSettings.selectedRegions.has(region.id)}
                            onChange={(e) => {
                              const newSelected = new Set(batchSettings.selectedRegions);
                              if (e.target.checked) {
                                newSelected.add(region.id);
                              } else {
                                newSelected.delete(region.id);
                              }
                              setBatchSettings(prev => ({ ...prev, selectedRegions: newSelected }));
                            }}
                            className="text-blue-600 bg-gray-700 border-gray-600 rounded 
                                     focus:ring-blue-500 focus:ring-2"
                          />
                          <span className="text-gray-300">{region.name}</span>
                        </label>
                      ))}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      已选择 {batchSettings.selectedRegions.size} 个区域
                    </div>
                  </div>

                  {/* 导入导出 */}
                  <div className="mt-4 flex justify-between">
                    <div className="flex space-x-2">
                      <button
                        onClick={handleExportData}
                        className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white 
                                 rounded-md transition-colors text-sm flex items-center space-x-1"
                      >
                        <Download className="w-4 h-4" />
                        <span>导出数据</span>
                      </button>
                      
                      <button
                        onClick={() => setShowImportDialog(true)}
                        className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white 
                                 rounded-md transition-colors text-sm flex items-center space-x-1"
                      >
                        <Upload className="w-4 h-4" />
                        <span>导入数据</span>
                      </button>
                    </div>
                    
                    <button
                      onClick={() => setShowBatchOperations(false)}
                      className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                    >
                      收起
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="text-center py-12">
            <Calculator className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              请选择区域进行价格配置
            </h3>
            <p className="text-gray-500">
              选择左侧区域列表中的区域来配置其配送价格
            </p>
          </div>
        )}
      </div>

      {/* 操作结果提示 */}
      <AnimatePresence>
        {operationResult && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 p-4 rounded-lg border z-50 ${
              operationResult.type === 'error'
                ? 'bg-red-900 border-red-700 text-red-200'
                : 'bg-green-900 border-green-700 text-green-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              {operationResult.type === 'error' ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
              <span>{operationResult.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 历史记录对话框 */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowHistory(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900 rounded-lg w-3/4 max-w-4xl max-h-[80vh] border border-gray-700"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">价格历史记录</h3>
              </div>
              
              <div className="p-4 max-h-96 overflow-y-auto">
                {historyData.length > 0 ? (
                  <div className="space-y-3">
                    {historyData.map(record => (
                      <div key={record.id} className="bg-gray-800 rounded-lg p-3 border border-gray-600">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-white font-medium">{record.action}</div>
                            <div className="text-sm text-gray-400">
                              {new Date(record.timestamp).toLocaleString()}
                            </div>
                          </div>
                          <div className="text-sm text-gray-300">
                            版本 {record.version}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    暂无历史记录
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-gray-700 flex justify-end">
                <button
                  onClick={() => setShowHistory(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 导入对话框 */}
      <AnimatePresence>
        {showImportDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowImportDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900 rounded-lg p-6 w-96 border border-gray-700"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white mb-4">导入价格数据</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    选择JSON文件
                  </label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        handleImportData(file);
                      }
                    }}
                    className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4
                             file:rounded-md file:border-0 file:text-sm file:font-semibold
                             file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  />
                </div>

                <div className="text-sm text-gray-400">
                  支持导入之前导出的价格配置文件
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowImportDialog(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  取消
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RegionPriceManager;