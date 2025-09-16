import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  X,
  Save,
  Eye,
  Copy,
  Clipboard,
  Loader,
  Database,
  Package
} from 'lucide-react';
import { apiPut, apiPost, apiGet } from '../utils/apiClient';

const BulkPriceImport = ({ onImportComplete }) => {
  const [showImport, setShowImport] = useState(false);
  const [pasteData, setPasteData] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  // 解析粘贴的表格数据（支持多区域）
  const parseTableData = (text) => {
    try {
      // 分割成行
      const lines = text.trim().split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        throw new Error('数据格式错误：至少需要包含表头和一行数据');
      }

      // 解析表头（第一行）
      const headers = lines[0].split('\t').map(h => h.trim());

      // 找到所有区域列的索引
      const zoneColumns = [];
      for (let i = 0; i < headers.length; i++) {
        const header = headers[i];
        // 匹配 Zone 1, Zone 2, ... 或 区域1, 区域2, ...
        const zoneMatch = header.match(/Zone\s*(\d+)|区域\s*(\d+)/i);
        if (zoneMatch) {
          const zoneNumber = zoneMatch[1] || zoneMatch[2];
          zoneColumns.push({
            index: i,
            zoneId: zoneNumber,
            zoneName: `区域${zoneNumber}`
          });
        }
      }

      if (zoneColumns.length === 0) {
        throw new Error('未找到任何区域价格列（需要包含 Zone 1, Zone 2 等标题）');
      }

      // 解析数据行
      const zonesData = {};

      // 初始化每个区域的数据
      zoneColumns.forEach(zone => {
        zonesData[zone.zoneId] = {
          zoneId: zone.zoneId,
          zoneName: zone.zoneName,
          weightRanges: []
        };
      });

      // 解析每一行数据
      for (let i = 1; i < lines.length; i++) {
        const cells = lines[i].split('\t').map(c => c.trim());

        if (cells.length < 3) continue; // 跳过不完整的行

        // 解析重量范围
        const minWeight = parseFloat(cells[0].replace(/[^\d.]/g, '')) || 0;
        const maxWeight = parseFloat(cells[1].replace(/[^\d.]/g, '')) || 0;

        if (minWeight >= 0 && maxWeight > minWeight) {
          // 为每个区域解析价格
          zoneColumns.forEach(zone => {
            if (zone.index < cells.length) {
              const priceStr = cells[zone.index].replace(/[^\d.]/g, '');
              const price = parseFloat(priceStr) || 0;

              if (price > 0) {
                zonesData[zone.zoneId].weightRanges.push({
                  rangeName: `${minWeight}-${maxWeight} KGS`,
                  minWeight,
                  maxWeight,
                  price,
                  isActive: true
                });
              }
            }
          });
        }
      }

      // 过滤出有有效数据的区域
      const validZones = Object.values(zonesData).filter(zone => zone.weightRanges.length > 0);

      if (validZones.length === 0) {
        throw new Error('未能解析出任何有效的价格数据');
      }

      return validZones;
    } catch (error) {
      console.error('解析表格数据失败:', error);
      throw error;
    }
  };

  // 处理粘贴
  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    setPasteData(text);

    try {
      const parsed = parseTableData(text);
      setParsedData(parsed);
      setImportResult(null);
    } catch (error) {
      setParsedData(null);
      setImportResult({
        type: 'error',
        message: error.message
      });
    }
  };

  // 处理文本变化
  const handleTextChange = (e) => {
    const text = e.target.value;
    setPasteData(text);

    if (text.trim()) {
      try {
        const parsed = parseTableData(text);
        setParsedData(parsed);
        setImportResult(null);
      } catch (error) {
        setParsedData(null);
        setImportResult({
          type: 'error',
          message: error.message
        });
      }
    } else {
      setParsedData(null);
      setImportResult(null);
    }
  };

  // 批量导入到数据库
  const handleImport = async () => {
    if (!parsedData || parsedData.length === 0) return;

    setImporting(true);
    setImportResult(null);
    setImportProgress({ current: 0, total: parsedData.length });

    const results = [];

    try {
      for (let i = 0; i < parsedData.length; i++) {
        const zoneData = parsedData[i];
        setImportProgress({ current: i + 1, total: parsedData.length });

        try {
          // 先检查区域是否存在
          let regionExists = false;
          try {
            await apiGet(`/regions/${zoneData.zoneId}`);
            regionExists = true;
          } catch (e) {
            // 区域不存在
          }

          if (regionExists) {
            // 更新现有区域的价格
            await apiPut(`/regions/${zoneData.zoneId}`, {
              weightRanges: zoneData.weightRanges
            });
            results.push({
              zone: zoneData.zoneName,
              status: 'success',
              message: `更新了${zoneData.weightRanges.length}个价格区间`
            });
          } else {
            // 创建新区域
            await apiPost('/regions', {
              id: zoneData.zoneId,
              name: zoneData.zoneName,
              isActive: true,
              weightRanges: zoneData.weightRanges
            });
            results.push({
              zone: zoneData.zoneName,
              status: 'success',
              message: `创建区域并导入${zoneData.weightRanges.length}个价格区间`
            });
          }
        } catch (error) {
          results.push({
            zone: zoneData.zoneName,
            status: 'error',
            message: error.message
          });
        }
      }

      // 统计结果
      const successCount = results.filter(r => r.status === 'success').length;
      const failedCount = results.filter(r => r.status === 'error').length;

      if (successCount === parsedData.length) {
        setImportResult({
          type: 'success',
          message: `成功导入所有${successCount}个区域的价格数据`,
          details: results
        });
      } else if (successCount > 0) {
        setImportResult({
          type: 'warning',
          message: `部分成功：${successCount}个区域导入成功，${failedCount}个失败`,
          details: results
        });
      } else {
        setImportResult({
          type: 'error',
          message: '所有区域导入失败',
          details: results
        });
      }

      // 触发刷新
      if (successCount > 0) {
        onImportComplete?.();

        // 5秒后关闭
        setTimeout(() => {
          setShowImport(false);
          setPasteData('');
          setParsedData(null);
          setImportResult(null);
          setImportProgress({ current: 0, total: 0 });
        }, 5000);
      }
    } catch (error) {
      setImportResult({
        type: 'error',
        message: `导入失败: ${error.message}`
      });
    } finally {
      setImporting(false);
      setImportProgress({ current: 0, total: 0 });
    }
  };

  // 示例数据
  const exampleData = `KGS↑	KGS↓	Zone 1	Zone 2	Zone 3	Zone 4	Zone 5
11.000	15.000	$6.21	$12.70	$12.87	$7.82	$13.54
15.000	20.000	$8.17	$14.65	$14.82	$9.09	$14.84
20.000	25.000	$10.93	$15.11	$15.28	$12.42	$15.81
25.000	30.000	$13.80	$18.98	$19.90	$14.95	$24.73
30.000	35.000	$14.95	$20.13	$21.28	$16.10	$25.88`;

  return (
    <>
      {/* 触发按钮 */}
      <button
        onClick={() => setShowImport(true)}
        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium rounded-lg transition-all flex items-center gap-2 shadow-lg"
      >
        <FileSpreadsheet className="w-5 h-5" />
        批量导入所有区域价格
      </button>

      {/* 导入弹窗 */}
      <AnimatePresence>
        {showImport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowImport(false);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gray-900 rounded-xl border border-gray-700 max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* 标题栏 */}
              <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between bg-gradient-to-r from-purple-900/20 to-blue-900/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                    <Database className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      批量导入所有区域价格
                    </h3>
                    <p className="text-sm text-gray-400">
                      一次性导入多个区域的完整价格表
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowImport(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* 内容区 */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* 说明 */}
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
                    <Clipboard className="w-4 h-4" />
                    使用说明
                  </h4>
                  <ol className="text-sm text-blue-200 space-y-1 list-decimal list-inside">
                    <li>从Excel选择包含所有区域价格的完整表格</li>
                    <li>确保表头包含 KGS↑、KGS↓、Zone 1、Zone 2 等列</li>
                    <li>复制选中的数据（Ctrl+C 或 Cmd+C）</li>
                    <li>点击下方输入框，粘贴数据（Ctrl+V 或 Cmd+V）</li>
                    <li>系统会自动识别并解析所有区域的价格</li>
                    <li>确认无误后点击"批量导入到数据库"</li>
                  </ol>
                </div>

                {/* 示例数据 */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-300">数据格式示例</h4>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(exampleData);
                        setPasteData(exampleData);
                        handleTextChange({ target: { value: exampleData } });
                      }}
                      className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300 flex items-center gap-1.5 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      复制示例
                    </button>
                  </div>
                  <pre className="text-xs text-gray-400 font-mono bg-gray-900 p-3 rounded overflow-x-auto">
{exampleData}
                  </pre>
                </div>

                {/* 粘贴区域 */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    粘贴Excel数据
                  </label>
                  <textarea
                    value={pasteData}
                    onChange={handleTextChange}
                    onPaste={handlePaste}
                    placeholder="在此粘贴从Excel复制的包含所有区域价格的数据..."
                    className="w-full h-48 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                {/* 解析预览 */}
                {parsedData && parsedData.length > 0 && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-green-300 mb-3 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      数据预览（解析出{parsedData.length}个区域）
                    </h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {parsedData.map((zone, zoneIndex) => (
                        <div key={zoneIndex} className="bg-gray-800/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-sm font-semibold text-white flex items-center gap-2">
                              <Package className="w-4 h-4 text-purple-400" />
                              {zone.zoneName}
                            </h5>
                            <span className="text-xs text-gray-400">
                              {zone.weightRanges.length}个价格区间
                            </span>
                          </div>
                          <div className="grid grid-cols-5 gap-2 text-xs">
                            {zone.weightRanges.slice(0, 5).map((range, index) => (
                              <div key={index} className="bg-gray-900/50 rounded p-2">
                                <div className="text-gray-400">{range.rangeName}</div>
                                <div className="text-green-400 font-semibold">${range.price.toFixed(2)}</div>
                              </div>
                            ))}
                            {zone.weightRanges.length > 5 && (
                              <div className="text-gray-500 text-center py-2">
                                ...还有{zone.weightRanges.length - 5}个
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 导入进度 */}
                {importing && importProgress.total > 0 && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-blue-300">导入进度</span>
                      <span className="text-sm text-blue-300">
                        {importProgress.current} / {importProgress.total}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <motion.div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}

                {/* 状态消息 */}
                {importResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg ${
                      importResult.type === 'success'
                        ? 'bg-green-500/20 border border-green-500/30'
                        : importResult.type === 'warning'
                        ? 'bg-yellow-500/20 border border-yellow-500/30'
                        : 'bg-red-500/20 border border-red-500/30'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {importResult.type === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                          importResult.type === 'warning' ? 'text-yellow-400' : 'text-red-400'
                        }`} />
                      )}
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${
                          importResult.type === 'success'
                            ? 'text-green-300'
                            : importResult.type === 'warning'
                            ? 'text-yellow-300'
                            : 'text-red-300'
                        }`}>
                          {importResult.message}
                        </p>
                        {importResult.details && (
                          <div className="mt-2 space-y-1">
                            {importResult.details.map((detail, index) => (
                              <div key={index} className="text-xs text-gray-400">
                                {detail.zone}: {detail.message}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* 底部操作栏 */}
              <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between bg-gray-800/50">
                <div className="text-sm text-gray-400">
                  {parsedData
                    ? `已解析${parsedData.length}个区域，共${parsedData.reduce((sum, z) => sum + z.weightRanges.length, 0)}个价格区间`
                    : '等待粘贴数据...'}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setPasteData('');
                      setParsedData(null);
                      setImportResult(null);
                    }}
                    className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                  >
                    清空
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={!parsedData || parsedData.length === 0 || importing}
                    className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                      !parsedData || parsedData.length === 0 || importing
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg'
                    }`}
                  >
                    {importing ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        导入中...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        批量导入到数据库
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BulkPriceImport;