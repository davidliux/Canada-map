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
  Clipboard
} from 'lucide-react';
import { apiPut } from '../utils/apiClient';

const PriceTableImport = ({ regionId, regionName, onImportComplete }) => {
  const [showImport, setShowImport] = useState(false);
  const [pasteData, setPasteData] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // 解析粘贴的表格数据
  const parseTableData = (text) => {
    try {
      // 分割成行
      const lines = text.trim().split('\n').filter(line => line.trim());

      // 解析表头（第一行）
      const headers = lines[0].split('\t').map(h => h.trim());

      // 找到区域列的索引
      let zoneColumnIndex = -1;
      const zonePattern = new RegExp(`Zone\\s*${regionId.replace('region', '')}|区域\\s*${regionId.replace('region', '')}`, 'i');

      headers.forEach((header, index) => {
        if (zonePattern.test(header)) {
          zoneColumnIndex = index;
        }
      });

      if (zoneColumnIndex === -1) {
        // 如果没有找到特定区域，尝试使用第3列（通常是第一个价格列）
        if (headers.length >= 3) {
          zoneColumnIndex = 2;
        } else {
          throw new Error(`未找到区域${regionId.replace('region', '')}的价格列`);
        }
      }

      // 解析数据行
      const weightRanges = [];

      for (let i = 1; i < lines.length; i++) {
        const cells = lines[i].split('\t').map(c => c.trim());

        if (cells.length < 3) continue; // 跳过不完整的行

        // 解析重量范围
        const minWeight = parseFloat(cells[0].replace(/[^\d.]/g, '')) || 0;
        const maxWeight = parseFloat(cells[1].replace(/[^\d.]/g, '')) || 0;

        // 解析价格
        let price = 0;
        if (zoneColumnIndex < cells.length) {
          price = parseFloat(cells[zoneColumnIndex].replace(/[^\d.]/g, '')) || 0;
        }

        if (minWeight >= 0 && maxWeight > minWeight && price > 0) {
          weightRanges.push({
            rangeName: `${minWeight}-${maxWeight} KGS`,
            minWeight,
            maxWeight,
            price,
            isActive: true
          });
        }
      }

      if (weightRanges.length === 0) {
        throw new Error('未能解析出有效的价格数据');
      }

      return weightRanges;
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

  // 导入到数据库
  const handleImport = async () => {
    if (!parsedData || parsedData.length === 0) return;

    setImporting(true);
    setImportResult(null);

    try {
      // 调用API更新区域价格
      await apiPut(`/regions/${regionId}`, {
        weightRanges: parsedData
      });

      setImportResult({
        type: 'success',
        message: `成功导入${parsedData.length}个价格区间到${regionName}`
      });

      // 触发刷新
      onImportComplete?.();

      // 3秒后关闭
      setTimeout(() => {
        setShowImport(false);
        setPasteData('');
        setParsedData(null);
        setImportResult(null);
      }, 3000);
    } catch (error) {
      setImportResult({
        type: 'error',
        message: `导入失败: ${error.message}`
      });
    } finally {
      setImporting(false);
    }
  };

  // 示例数据
  const exampleData = `KGS↑	KGS↓	Zone ${regionId.replace('region', '')}
11.000	15.000	$6.21
15.000	20.000	$8.17
20.000	25.000	$10.93
25.000	30.000	$13.80
30.000	35.000	$14.95`;

  return (
    <>
      {/* 触发按钮 */}
      <button
        onClick={() => setShowImport(true)}
        className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-300 transition-colors text-sm flex items-center gap-2"
      >
        <FileSpreadsheet className="w-4 h-4" />
        表格导入
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
              className="bg-gray-900 rounded-xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* 标题栏 */}
              <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <FileSpreadsheet className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      导入价格表格 - {regionName}
                    </h3>
                    <p className="text-sm text-gray-400">
                      从Excel复制数据，直接粘贴到下方区域
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
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
                    <Clipboard className="w-4 h-4" />
                    使用说明
                  </h4>
                  <ol className="text-sm text-blue-200 space-y-1 list-decimal list-inside">
                    <li>从Excel选择包含重量范围和价格的数据</li>
                    <li>复制选中的数据（Ctrl+C 或 Cmd+C）</li>
                    <li>点击下方输入框，粘贴数据（Ctrl+V 或 Cmd+V）</li>
                    <li>系统会自动解析并预览数据</li>
                    <li>确认无误后点击"导入到数据库"</li>
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
                      className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
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
                    placeholder="在此粘贴从Excel复制的数据..."
                    className="w-full h-48 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* 解析预览 */}
                {parsedData && parsedData.length > 0 && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-green-300 mb-3 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      数据预览（{parsedData.length}个价格区间）
                    </h4>
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-green-500/20">
                            <th className="text-left py-2 text-gray-400">重量范围</th>
                            <th className="text-left py-2 text-gray-400">最小重量(kg)</th>
                            <th className="text-left py-2 text-gray-400">最大重量(kg)</th>
                            <th className="text-left py-2 text-gray-400">价格($)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedData.map((range, index) => (
                            <tr key={index} className="border-b border-gray-800">
                              <td className="py-2 text-white">{range.rangeName}</td>
                              <td className="py-2 text-gray-300">{range.minWeight}</td>
                              <td className="py-2 text-gray-300">{range.maxWeight}</td>
                              <td className="py-2 text-green-400 font-semibold">
                                ${range.price.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 状态消息 */}
                {importResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg ${
                      importResult.type === 'success'
                        ? 'bg-green-500/20 border border-green-500/30'
                        : 'bg-red-500/20 border border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {importResult.type === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                      )}
                      <span className={`text-sm ${
                        importResult.type === 'success' ? 'text-green-300' : 'text-red-300'
                      }`}>
                        {importResult.message}
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* 底部操作栏 */}
              <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  {parsedData ? `已解析${parsedData.length}个价格区间` : '等待粘贴数据...'}
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
                    className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                      !parsedData || parsedData.length === 0 || importing
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    {importing ? '导入中...' : '导入到数据库'}
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

export default PriceTableImport;