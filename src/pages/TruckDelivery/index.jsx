import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Truck,
  Download,
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';

import CityManager from '../../components/cities/CityManager';
import { 
  exportTruckDeliveryData, 
  importTruckDeliveryData,
  validateImportData,
  generateExportFileName,
  downloadJsonFile,
  readJsonFile,
  getImportExportStats,
  EXPORT_MODES,
  IMPORT_MODES
} from '../../utils/truck/importExportService.js';

const TruckDelivery = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState(null);
  const [importValidation, setImportValidation] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [exportStats, setExportStats] = useState(null);

  // 处理导出
  const handleExport = async (exportMode = EXPORT_MODES.ALL) => {
    try {
      setIsExporting(true);
      
      const options = {
        mode: exportMode,
        includePrices: true,
        includeInactive: true
      };

      const data = await exportTruckDeliveryData(options);
      const filename = generateExportFileName('truck_delivery', exportMode);
      
      downloadJsonFile(data, filename);
      
      // 获取导出统计
      const stats = await getImportExportStats();
      setExportStats(stats);

      console.log('导出成功:', filename);
    } catch (error) {
      console.error('导出失败:', error);
      alert(`导出失败: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // 处理文件选择
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const data = await readJsonFile(file);
      const validation = validateImportData(data);
      
      setImportData(data);
      setImportValidation(validation);
      setShowImportDialog(true);
      
      // 清除文件输入
      event.target.value = '';
    } catch (error) {
      console.error('文件读取失败:', error);
      alert(`文件读取失败: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  // 执行导入
  const handleImport = async (importMode = IMPORT_MODES.SKIP) => {
    if (!importData) return;

    try {
      setIsImporting(true);
      
      const options = {
        mode: importMode,
        validateData: true,
        importPrices: true,
        onProgress: (progress) => {
          console.log('导入进度:', progress);
        }
      };

      const result = await importTruckDeliveryData(importData, options);
      setImportResult(result);
      
      console.log('导入完成:', result);
    } catch (error) {
      console.error('导入失败:', error);
      alert(`导入失败: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  // 关闭导入对话框
  const closeImportDialog = () => {
    setShowImportDialog(false);
    setImportData(null);
    setImportValidation(null);
    setImportResult(null);
  };

  return (
    <div className="h-full bg-gray-900">
      {/* 页面标题和操作栏 */}
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Truck className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-2xl font-bold text-white">卡车派送管理</h1>
              <p className="text-gray-400 text-sm mt-1">管理城市配送区域和价格策略</p>
            </div>
          </div>
          
          {/* 导入导出操作区 */}
          <div className="flex items-center space-x-3">
            {/* 导出按钮 */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleExport(EXPORT_MODES.ALL)}
              disabled={isExporting}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 px-4 py-2 rounded-lg text-white font-medium transition-colors"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isExporting ? '导出中...' : '导出数据'}</span>
            </motion.button>

            {/* 导入按钮 */}
            <motion.label
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-medium cursor-pointer transition-colors"
            >
              {isImporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>{isImporting ? '读取中...' : '导入数据'}</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                disabled={isImporting}
                className="hidden"
              />
            </motion.label>
          </div>
        </div>

        {/* 导出统计信息 */}
        {exportStats && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded-lg"
          >
            <div className="flex items-center space-x-2 text-green-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>
                导出成功: {exportStats.cities.total} 个城市, {exportStats.priceTables.total} 个价格表
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* 导入预览对话框 */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <span>导入数据预览</span>
              </h3>
              <button
                onClick={closeImportDialog}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* 验证结果 */}
            {importValidation && (
              <div className="mb-6">
                <div className={`flex items-center space-x-2 mb-3 ${
                  importValidation.isValid ? 'text-green-400' : 'text-red-400'
                }`}>
                  {importValidation.isValid ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                  <span className="font-medium">
                    {importValidation.isValid ? '数据验证通过' : '数据验证失败'}
                  </span>
                </div>

                {/* 统计信息 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <div className="text-gray-400">城市数量</div>
                    <div className="text-white font-bold">{importValidation.stats.cityCount}</div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <div className="text-gray-400">区域数量</div>
                    <div className="text-white font-bold">{importValidation.stats.regionCount}</div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <div className="text-gray-400">FSA数量</div>
                    <div className="text-white font-bold">{importValidation.stats.fsaCount}</div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <div className="text-gray-400">价格表</div>
                    <div className="text-white font-bold">{importValidation.stats.priceTableCount}</div>
                  </div>
                </div>

                {/* 错误信息 */}
                {importValidation.errors.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 text-red-400 mb-2">
                      <XCircle className="w-4 h-4" />
                      <span className="font-medium">错误信息:</span>
                    </div>
                    <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 max-h-32 overflow-y-auto">
                      {importValidation.errors.map((error, index) => (
                        <div key={index} className="text-red-300 text-sm">{error}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 警告信息 */}
                {importValidation.warnings.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 text-yellow-400 mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="font-medium">警告信息:</span>
                    </div>
                    <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3 max-h-32 overflow-y-auto">
                      {importValidation.warnings.map((warning, index) => (
                        <div key={index} className="text-yellow-300 text-sm">{warning}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 导入结果 */}
            {importResult && (
              <div className="mb-6">
                <h4 className="text-lg font-medium text-white mb-3">导入结果</h4>
                
                {/* 成功统计 */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="bg-green-900/20 border border-green-700 p-3 rounded-lg">
                    <div className="text-green-400 font-medium">成功导入</div>
                    <div className="text-white">
                      城市: {importResult.summary.successCities} | 
                      价格表: {importResult.summary.successPriceTables}
                    </div>
                  </div>
                  <div className="bg-red-900/20 border border-red-700 p-3 rounded-lg">
                    <div className="text-red-400 font-medium">导入失败</div>
                    <div className="text-white">
                      城市: {importResult.summary.failedCities} | 
                      价格表: {importResult.summary.failedPriceTables}
                    </div>
                  </div>
                </div>

                {/* 详细结果 */}
                {importResult.success.length > 0 && (
                  <div className="mb-4">
                    <div className="text-green-400 font-medium mb-2">成功项目:</div>
                    <div className="bg-gray-700 rounded-lg p-3 max-h-32 overflow-y-auto">
                      {importResult.success.slice(0, 10).map((item, index) => (
                        <div key={index} className="text-green-300 text-sm">
                          {item.name} ({item.type === 'city' ? '城市' : '价格表'})
                        </div>
                      ))}
                      {importResult.success.length > 10 && (
                        <div className="text-gray-400 text-sm">
                          还有 {importResult.success.length - 10} 个项目...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {importResult.failed.length > 0 && (
                  <div className="mb-4">
                    <div className="text-red-400 font-medium mb-2">失败项目:</div>
                    <div className="bg-gray-700 rounded-lg p-3 max-h-32 overflow-y-auto">
                      {importResult.failed.slice(0, 10).map((item, index) => (
                        <div key={index} className="text-red-300 text-sm">
                          {item.name}: {item.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeImportDialog}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                取消
              </button>
              
              {!importResult && importValidation?.isValid && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleImport(IMPORT_MODES.SKIP)}
                    disabled={isImporting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors"
                  >
                    {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : '跳过重复'}
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleImport(IMPORT_MODES.OVERWRITE)}
                    disabled={isImporting}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 text-white rounded-lg transition-colors"
                  >
                    {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : '覆盖导入'}
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* 城市管理组件 */}
      <CityManager />
    </div>
  );
};

export default TruckDelivery;