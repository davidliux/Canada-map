import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Upload, 
  FileText, 
  Database, 
  AlertCircle, 
  CheckCircle,
  X,
  FileJson,
  FileSpreadsheet
} from 'lucide-react';
// 注意：ImportExportManager需要重构以使用统一存储架构
// 暂时注释掉fsaImportExport导入，因为在统一架构中不再需要单独的FSA导入导出
// import {
//   exportFSAConfigsAsJSON,
//   exportFSAConfigsAsCSV,
//   exportWeightRangeCSV,
//   importFSAConfigsFromJSON,
//   importFSAConfigsFromCSV,
//   downloadFile,
//   readUploadedFile
// } from '../utils/fsaImportExport.js';

// 临时的占位函数，避免组件报错
const exportFSAConfigsAsJSON = () => ({ configs: {} });
const exportFSAConfigsAsCSV = () => '';
const exportWeightRangeCSV = () => '';
const importFSAConfigsFromJSON = () => ({ success: false, imported: 0, failed: 0 });
const importFSAConfigsFromCSV = () => ({ success: false, imported: 0, failed: 0 });
const downloadFile = () => {};
const readUploadedFile = () => Promise.resolve('');

/**
 * 导入导出管理组件
 */
const ImportExportManager = ({ onClose, onDataChange }) => {
  const [activeTab, setActiveTab] = useState('export'); // 'export' | 'import'
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [selectedFSAs, setSelectedFSAs] = useState([]);

  /**
   * 导出JSON格式
   */
  const handleExportJSON = async () => {
    setIsProcessing(true);
    try {
      const data = exportFSAConfigsAsJSON(selectedFSAs);
      const content = JSON.stringify(data, null, 2);
      const filename = `fsa_configs_${new Date().toISOString().split('T')[0]}.json`;
      downloadFile(content, filename, 'application/json');
      
      setResults({
        type: 'success',
        message: `成功导出 ${data.totalConfigs} 个FSA配置`
      });
    } catch (error) {
      setResults({
        type: 'error',
        message: `导出失败: ${error.message}`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * 导出CSV格式
   */
  const handleExportCSV = async () => {
    setIsProcessing(true);
    try {
      const content = exportFSAConfigsAsCSV(selectedFSAs);
      const filename = `fsa_configs_${new Date().toISOString().split('T')[0]}.csv`;
      downloadFile(content, filename, 'text/csv');
      
      setResults({
        type: 'success',
        message: '成功导出CSV格式配置文件'
      });
    } catch (error) {
      setResults({
        type: 'error',
        message: `导出失败: ${error.message}`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * 处理文件导入
   */
  const handleFileImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    setResults(null);

    try {
      const content = await readUploadedFile(file);
      let importResults;

      if (file.name.endsWith('.json')) {
        const jsonData = JSON.parse(content);
        importResults = importFSAConfigsFromJSON(jsonData);
      } else if (file.name.endsWith('.csv')) {
        importResults = importFSAConfigsFromCSV(content);
      } else {
        throw new Error('不支持的文件格式，请选择JSON或CSV文件');
      }

      setResults({
        type: importResults.success ? 'success' : 'warning',
        message: `导入完成: 成功 ${importResults.imported} 个，失败 ${importResults.failed} 个`,
        details: {
          imported: importResults.imported,
          failed: importResults.failed,
          errors: importResults.errors,
          warnings: importResults.warnings
        }
      });

      if (importResults.imported > 0) {
        onDataChange?.();
      }

    } catch (error) {
      setResults({
        type: 'error',
        message: `导入失败: ${error.message}`
      });
    } finally {
      setIsProcessing(false);
      event.target.value = ''; // 重置文件输入
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div className="bg-cyber-gray/95 backdrop-blur-md border border-cyber-blue/30 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="p-6 border-b border-cyber-blue/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-cyber-blue/20 rounded-lg">
                <Database className="w-6 h-6 text-cyber-blue" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">数据导入导出</h2>
                <p className="text-gray-300">管理FSA配置数据的批量操作</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 标签页导航 */}
        <div className="px-6 pt-4">
          <div className="flex space-x-1 bg-cyber-gray/50 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('export')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'export'
                  ? 'bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Download className="w-4 h-4 inline mr-2" />
              导出数据
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'import'
                  ? 'bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              导入数据
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <AnimatePresence mode="wait">
            {activeTab === 'export' && (
              <motion.div
                key="export"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* 导出选项 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">选择导出格式</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* JSON导出 */}
                    <button
                      onClick={handleExportJSON}
                      disabled={isProcessing}
                      className="p-4 bg-cyber-gray/30 border border-cyber-blue/30 rounded-lg hover:bg-cyber-blue/10 transition-colors disabled:opacity-50 text-left"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <FileJson className="w-6 h-6 text-blue-400" />
                        <span className="font-medium text-white">JSON格式</span>
                      </div>
                      <p className="text-sm text-gray-400">
                        完整的配置数据，包含所有字段信息，适合系统间迁移
                      </p>
                    </button>

                    {/* CSV导出 */}
                    <button
                      onClick={handleExportCSV}
                      disabled={isProcessing}
                      className="p-4 bg-cyber-gray/30 border border-cyber-blue/30 rounded-lg hover:bg-cyber-blue/10 transition-colors disabled:opacity-50 text-left"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <FileSpreadsheet className="w-6 h-6 text-green-400" />
                        <span className="font-medium text-white">CSV格式</span>
                      </div>
                      <p className="text-sm text-gray-400">
                        表格格式，可用Excel打开编辑，适合批量修改
                      </p>
                    </button>
                  </div>
                </div>

                {/* FSA选择 */}
                <div className="space-y-3">
                  <h4 className="font-medium text-white">导出范围</h4>
                  <div className="p-3 bg-cyber-gray/20 border border-cyber-blue/20 rounded-lg">
                    <label className="flex items-center gap-2 text-gray-300">
                      <input
                        type="radio"
                        name="exportRange"
                        checked={selectedFSAs.length === 0}
                        onChange={() => setSelectedFSAs([])}
                        className="text-cyber-blue"
                      />
                      导出所有FSA配置
                    </label>
                  </div>
                  <div className="p-3 bg-cyber-gray/20 border border-cyber-blue/20 rounded-lg">
                    <label className="flex items-center gap-2 text-gray-300">
                      <input
                        type="radio"
                        name="exportRange"
                        checked={selectedFSAs.length > 0}
                        onChange={() => setSelectedFSAs(['V6B'])} // 示例
                        className="text-cyber-blue"
                      />
                      导出指定FSA配置 (功能开发中)
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'import' && (
              <motion.div
                key="import"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* 导入说明 */}
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-300 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium">导入须知</span>
                  </div>
                  <ul className="text-sm text-yellow-200 space-y-1">
                    <li>• 支持JSON和CSV格式文件</li>
                    <li>• 导入前会自动备份现有数据</li>
                    <li>• 重复的FSA配置将被覆盖</li>
                    <li>• 无效的配置数据将被跳过</li>
                  </ul>
                </div>

                {/* 文件上传 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">选择导入文件</h3>
                  
                  <div className="border-2 border-dashed border-cyber-blue/30 rounded-lg p-8 text-center">
                    <input
                      type="file"
                      accept=".json,.csv"
                      onChange={handleFileImport}
                      disabled={isProcessing}
                      className="hidden"
                      id="import-file"
                    />
                    <label
                      htmlFor="import-file"
                      className={`cursor-pointer ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Upload className="w-12 h-12 text-cyber-blue mx-auto mb-4" />
                      <p className="text-white font-medium mb-2">
                        {isProcessing ? '处理中...' : '点击选择文件或拖拽到此处'}
                      </p>
                      <p className="text-gray-400 text-sm">
                        支持 .json 和 .csv 格式文件
                      </p>
                    </label>
                  </div>
                </div>

                {/* 示例文件下载 */}
                <div className="space-y-3">
                  <h4 className="font-medium text-white">示例文件</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        const sampleData = {
                          exportDate: new Date().toISOString(),
                          version: '1.0.0',
                          totalConfigs: 1,
                          configs: {
                            'V6B': {
                              fsaCode: 'V6B',
                              province: 'BC',
                              region: 'Vancouver',
                              postalCodes: ['V6B 1A1', 'V6B 1A2'],
                              weightRanges: [
                                { id: 'range_1', min: 0, max: 11, label: '0-11.000 KGS', price: 15.99, isActive: true }
                              ],
                              isActive: true,
                              lastUpdated: new Date().toISOString(),
                              metadata: { notes: '示例配置' }
                            }
                          }
                        };
                        downloadFile(JSON.stringify(sampleData, null, 2), 'sample_fsa_config.json', 'application/json');
                      }}
                      className="p-3 bg-cyber-gray/30 border border-cyber-blue/30 rounded-lg hover:bg-cyber-blue/10 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 text-blue-400">
                        <FileJson className="w-4 h-4" />
                        <span className="text-sm">下载JSON示例</span>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => {
                        const csvContent = 'FSA代码,省份,地区,是否启用,邮编列表,重量区间配置,最后更新时间,备注\nV6B,BC,Vancouver,是,"V6B 1A1;V6B 1A2","[{""id"":""range_1"",""min"":0,""max"":11,""label"":""0-11.000 KGS"",""price"":15.99,""isActive"":true}]",2024-01-15T10:00:00.000Z,示例配置';
                        downloadFile(csvContent, 'sample_fsa_config.csv', 'text/csv');
                      }}
                      className="p-3 bg-cyber-gray/30 border border-cyber-blue/30 rounded-lg hover:bg-cyber-blue/10 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 text-green-400">
                        <FileSpreadsheet className="w-4 h-4" />
                        <span className="text-sm">下载CSV示例</span>
                      </div>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 结果显示 */}
        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6 border-t border-cyber-blue/20"
            >
              <div className={`p-4 rounded-lg border ${
                results.type === 'success' 
                  ? 'bg-green-500/20 border-green-500/30' 
                  : results.type === 'warning'
                  ? 'bg-yellow-500/20 border-yellow-500/30'
                  : 'bg-red-500/20 border-red-500/30'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {results.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-green-300" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-300" />
                  )}
                  <span className={`font-medium ${
                    results.type === 'success' ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {results.message}
                  </span>
                </div>
                
                {results.details && (
                  <div className="text-sm text-gray-300 space-y-1">
                    {results.details.errors.length > 0 && (
                      <div>
                        <strong>错误:</strong>
                        <ul className="ml-4 list-disc">
                          {results.details.errors.slice(0, 5).map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                          {results.details.errors.length > 5 && (
                            <li>... 还有 {results.details.errors.length - 5} 个错误</li>
                          )}
                        </ul>
                      </div>
                    )}
                    
                    {results.details.warnings.length > 0 && (
                      <div>
                        <strong>警告:</strong>
                        <ul className="ml-4 list-disc">
                          {results.details.warnings.slice(0, 3).map((warning, index) => (
                            <li key={index}>{warning}</li>
                          ))}
                          {results.details.warnings.length > 3 && (
                            <li>... 还有 {results.details.warnings.length - 3} 个警告</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ImportExportManager;
