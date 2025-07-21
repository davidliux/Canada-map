import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Download,
  CheckCircle,
  AlertTriangle,
  FileText,
  Settings,
  Eye,
  Save,
  RotateCcw
} from 'lucide-react';
import { getAllRegionConfigs, saveRegionConfig } from '../utils/unifiedStorage.js';
import { generateWeightRangeId, formatWeightRangeLabel } from '../data/fsaManagement.js';

/**
 * 批量价格导入器组件
 * 支持从表格数据批量导入重量区间价格配置
 */
const BatchPriceImporter = ({ onImportComplete, onClose }) => {
  const [step, setStep] = useState(1); // 1: 数据输入, 2: 数据预览, 3: 区域映射, 4: 导入确认
  const [rawData, setRawData] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [regionMapping, setRegionMapping] = useState({});
  const [importResult, setImportResult] = useState(null);
  const [errors, setErrors] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // 示例数据
  const exampleData = `KGS↑	KGS↓	Zone 1	Zone 2 	Zone 3 	Zone 4 	Zone 5 
11.000 	15.000 	$6.21	$12.70	$12.87	$7.82	$13.54
15.000 	20.000 	$8.17	$14.65	$14.82	$9.09	$14.84
20.000 	25.000 	$10.93	$15.11	$15.28	$12.42	$15.81
25.000 	30.000 	$13.80	$18.98	$19.90	$14.95	$24.73
30.000 	35.000 	$14.95	$20.13	$21.28	$16.10	$25.88
35.000 	40.000 	$17.25	$22.43	$23.58	$18.40	$27.03
40.000 	45.000 	$18.40	$23.58	$24.73	$19.55	$28.18
45.000 	50.000 	$19.55	$24.73	$25.88	$20.70	$29.33
50.000 	55.000 	$20.70	$25.88	$27.03	$21.85	$30.48
55.000 	60.000 	$23.00	$28.18	$29.33	$24.15	$32.55
60.000 	64.000 	$26.45	$31.63	$32.78	$27.60	$34.96
64.000 	65.000 	$28.75	$33.93	$35.08	$29.90	$37.38`;

  // 解析表格数据
  const parseTableData = (data) => {
    try {
      const lines = data.trim().split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        throw new Error('数据至少需要包含标题行和一行数据');
      }

      // 解析标题行
      const headerLine = lines[0];
      const headers = headerLine.split(/\t|\s{2,}/).map(h => h.trim()).filter(h => h);
      
      // 验证标题格式
      if (headers.length < 3) {
        throw new Error('数据格式错误：至少需要起始重量、结束重量和一个价格列');
      }

      // 查找重量列和价格列
      const weightStartIndex = headers.findIndex(h => h.toLowerCase().includes('kg') && (h.includes('↑') || h.toLowerCase().includes('start')));
      const weightEndIndex = headers.findIndex(h => h.toLowerCase().includes('kg') && (h.includes('↓') || h.toLowerCase().includes('end')));
      
      if (weightStartIndex === -1 || weightEndIndex === -1) {
        throw new Error('未找到重量列：请确保包含KGS↑和KGS↓列');
      }

      // 提取价格列（Zone列）
      const priceColumns = headers.slice(2).map((header, index) => ({
        index: index + 2,
        name: header,
        originalName: header
      }));

      // 解析数据行
      const weightRanges = [];
      const parseErrors = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const cells = line.split(/\t|\s{2,}/).map(c => c.trim()).filter(c => c);
        
        if (cells.length < headers.length - 1) {
          parseErrors.push(`第${i + 1}行数据不完整`);
          continue;
        }

        try {
          const startWeight = parseFloat(cells[weightStartIndex]);
          const endWeight = parseFloat(cells[weightEndIndex]);
          
          if (isNaN(startWeight) || isNaN(endWeight)) {
            parseErrors.push(`第${i + 1}行重量数据无效`);
            continue;
          }

          if (startWeight >= endWeight) {
            parseErrors.push(`第${i + 1}行重量区间无效：起始重量应小于结束重量`);
            continue;
          }

          // 解析价格数据
          const prices = {};
          priceColumns.forEach(col => {
            const priceText = cells[col.index] || '';
            const priceValue = parseFloat(priceText.replace(/[$,]/g, ''));
            
            if (!isNaN(priceValue) && priceValue >= 0) {
              prices[col.name] = priceValue;
            } else {
              parseErrors.push(`第${i + 1}行${col.name}价格无效：${priceText}`);
            }
          });

          weightRanges.push({
            id: `range_${startWeight}_${endWeight}`,
            min: startWeight,
            max: endWeight,
            label: `${startWeight}-${endWeight} KG`,
            prices,
            isActive: true
          });

        } catch (error) {
          parseErrors.push(`第${i + 1}行解析失败：${error.message}`);
        }
      }

      if (weightRanges.length === 0) {
        throw new Error('没有成功解析到任何有效的重量区间数据');
      }

      return {
        headers,
        priceColumns,
        weightRanges,
        errors: parseErrors,
        summary: {
          totalRanges: weightRanges.length,
          priceZones: priceColumns.length,
          minWeight: Math.min(...weightRanges.map(r => r.min)),
          maxWeight: Math.max(...weightRanges.map(r => r.max))
        }
      };

    } catch (error) {
      throw new Error(`数据解析失败：${error.message}`);
    }
  };

  // 处理数据解析
  const handleParseData = () => {
    if (!rawData.trim()) {
      setErrors(['请输入要解析的表格数据']);
      return;
    }

    setIsProcessing(true);
    setErrors([]);

    try {
      const parsed = parseTableData(rawData);
      setParsedData(parsed);
      setErrors(parsed.errors);
      
      // 初始化区域映射
      const mapping = {};
      parsed.priceColumns.forEach((col, index) => {
        mapping[col.name] = `${index + 1}`; // 默认映射到区域1-5
      });
      setRegionMapping(mapping);
      
      setStep(2);
    } catch (error) {
      setErrors([error.message]);
    } finally {
      setIsProcessing(false);
    }
  };

  // 使用示例数据
  const handleUseExample = () => {
    setRawData(exampleData);
  };

  // 重置数据
  const handleReset = () => {
    setStep(1);
    setRawData('');
    setParsedData(null);
    setRegionMapping({});
    setImportResult(null);
    setErrors([]);
  };

  // 执行批量导入
  const handleImport = async () => {
    if (!parsedData || Object.keys(regionMapping).length === 0) {
      setErrors(['请完成区域映射配置']);
      return;
    }

    setIsProcessing(true);
    setErrors([]);

    try {
      const regionConfigs = getAllRegionConfigs();
      const importResults = [];
      const importErrors = [];

      // 为每个映射的区域导入价格数据
      for (const [columnName, regionId] of Object.entries(regionMapping)) {
        if (!regionId) continue;

        const regionConfig = regionConfigs[regionId];
        if (!regionConfig) {
          importErrors.push(`区域${regionId}不存在`);
          continue;
        }

        // 构建新的重量区间数据
        const newWeightRanges = parsedData.weightRanges.map(range => ({
          id: generateWeightRangeId(range.min, range.max),
          min: range.min,
          max: range.max,
          price: range.prices[columnName] || 0,
          label: formatWeightRangeLabel(range.min, range.max),
          isActive: true
        }));

        // 更新区域配置
        const updatedConfig = {
          ...regionConfig,
          weightRanges: newWeightRanges,
          lastUpdated: new Date().toISOString(),
          metadata: {
            ...regionConfig.metadata,
            importedAt: new Date().toISOString(),
            importSource: 'batch_import',
            version: '2.1.0'
          }
        };

        // 保存配置
        const success = saveRegionConfig(regionId, updatedConfig);
        if (success) {
          importResults.push({
            regionId,
            regionName: `${regionId}区`,
            columnName,
            rangeCount: newWeightRanges.length,
            priceRange: {
              min: Math.min(...newWeightRanges.map(r => r.price)),
              max: Math.max(...newWeightRanges.map(r => r.price))
            }
          });
        } else {
          importErrors.push(`区域${regionId}保存失败`);
        }
      }

      setImportResult({
        success: importResults.length > 0,
        importedRegions: importResults,
        errors: importErrors,
        summary: {
          totalRegions: importResults.length,
          totalRanges: parsedData.weightRanges.length,
          importTime: new Date().toISOString()
        }
      });

      setStep(4);

    } catch (error) {
      setErrors([`导入失败：${error.message}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[3000] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gradient-to-br from-gray-900 to-gray-800 border border-blue-500/30 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-6 border-b border-blue-500/20">
          <div className="flex items-center gap-3">
            <Upload className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-bold text-white">批量价格导入</h2>
              <p className="text-sm text-gray-400">从表格数据批量配置重量区间价格</p>
            </div>
          </div>
          
          {/* 步骤指示器 */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((stepNum) => (
              <div
                key={stepNum}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNum
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {stepNum}
              </div>
            ))}
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <span className="text-gray-400 text-xl">×</span>
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* 步骤1: 数据输入 */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">步骤1: 输入表格数据</h3>
                <p className="text-gray-400 text-sm mb-4">
                  请将包含重量区间和价格的表格数据粘贴到下方文本框中。支持制表符分隔或空格分隔的数据。
                </p>
              </div>

              {/* 数据格式说明 */}
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <h4 className="text-blue-300 font-medium mb-2">数据格式要求：</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• 第一行为标题行，包含KGS↑、KGS↓和各区域价格列</li>
                  <li>• 重量数据为数字格式（如：11.000、15.000）</li>
                  <li>• 价格数据支持$符号（如：$6.21、$12.70）</li>
                  <li>• 支持制表符、多个空格或逗号分隔</li>
                </ul>
              </div>

              {/* 示例数据按钮 */}
              <div className="flex gap-3">
                <button
                  onClick={handleUseExample}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  使用示例数据
                </button>
              </div>

              {/* 数据输入框 */}
              <div>
                <label className="block text-white font-medium mb-2">表格数据：</label>
                <textarea
                  value={rawData}
                  onChange={(e) => setRawData(e.target.value)}
                  placeholder="请粘贴表格数据..."
                  className="w-full h-64 px-4 py-3 bg-gray-800/70 border border-gray-600 rounded-lg text-white placeholder-gray-400 font-mono text-sm resize-none focus:border-blue-400 focus:outline-none"
                />
              </div>

              {/* 错误显示 */}
              {errors.length > 0 && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-red-400 font-medium">数据解析错误</span>
                  </div>
                  <ul className="text-sm text-red-300 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex justify-between">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  重置
                </button>
                
                <button
                  onClick={handleParseData}
                  disabled={!rawData.trim() || isProcessing}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      解析中...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      解析数据
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 步骤2: 数据预览 */}
          {step === 2 && parsedData && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">步骤2: 数据预览</h3>
                <p className="text-gray-400 text-sm mb-4">
                  请检查解析后的数据是否正确。如有问题，请返回上一步修改原始数据。
                </p>
              </div>

              {/* 数据摘要 */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">{parsedData.summary.totalRanges}</div>
                  <div className="text-sm text-gray-400">重量区间</div>
                </div>
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">{parsedData.summary.priceZones}</div>
                  <div className="text-sm text-gray-400">价格区域</div>
                </div>
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-400">{parsedData.summary.minWeight}</div>
                  <div className="text-sm text-gray-400">最小重量(KG)</div>
                </div>
                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">{parsedData.summary.maxWeight}</div>
                  <div className="text-sm text-gray-400">最大重量(KG)</div>
                </div>
              </div>

              {/* 数据表格预览 */}
              <div className="bg-gray-800/50 border border-gray-600/50 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-gray-600/50">
                  <h4 className="text-white font-medium">重量区间和价格预览</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-700/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">重量区间</th>
                        {parsedData.priceColumns.map(col => (
                          <th key={col.name} className="px-4 py-3 text-left text-sm font-medium text-gray-300">
                            {col.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.weightRanges.slice(0, 10).map((range, index) => (
                        <tr key={range.id} className={index % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-700/30'}>
                          <td className="px-4 py-3 text-sm text-white">{range.label}</td>
                          {parsedData.priceColumns.map(col => (
                            <td key={col.name} className="px-4 py-3 text-sm text-green-400">
                              ${range.prices[col.name]?.toFixed(2) || 'N/A'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedData.weightRanges.length > 10 && (
                    <div className="p-4 text-center text-gray-400 text-sm">
                      ... 还有 {parsedData.weightRanges.length - 10} 行数据
                    </div>
                  )}
                </div>
              </div>

              {/* 解析错误显示 */}
              {errors.length > 0 && (
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 font-medium">解析警告</span>
                  </div>
                  <ul className="text-sm text-yellow-300 space-y-1 max-h-32 overflow-y-auto">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  上一步
                </button>

                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  配置区域映射
                </button>
              </div>
            </div>
          )}

          {/* 步骤3: 区域映射 */}
          {step === 3 && parsedData && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">步骤3: 配置区域映射</h3>
                <p className="text-gray-400 text-sm mb-4">
                  请将表格中的价格列映射到系统中的配送区域。每个价格列将应用到对应的配送区域。
                </p>
              </div>

              {/* 区域映射配置 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {parsedData.priceColumns.map((col, index) => (
                  <div key={col.name} className="bg-gray-800/50 border border-gray-600/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-medium">{col.name}</h4>
                      <div className="text-sm text-gray-400">
                        {parsedData.weightRanges.length} 个价格
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="block text-sm text-gray-400 mb-2">映射到配送区域：</label>
                      <select
                        value={regionMapping[col.name] || ''}
                        onChange={(e) => setRegionMapping(prev => ({
                          ...prev,
                          [col.name]: e.target.value
                        }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:border-blue-400 focus:outline-none"
                      >
                        <option value="">请选择区域</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(regionNum => (
                          <option key={regionNum} value={regionNum.toString()}>
                            {regionNum}区 - 配送区域{regionNum}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 价格预览 */}
                    <div className="text-sm">
                      <div className="text-gray-400 mb-1">价格范围：</div>
                      <div className="text-green-400">
                        ${Math.min(...parsedData.weightRanges.map(r => r.prices[col.name] || 0)).toFixed(2)} -
                        ${Math.max(...parsedData.weightRanges.map(r => r.prices[col.name] || 0)).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 映射验证 */}
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <h4 className="text-blue-300 font-medium mb-2">映射验证：</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">已映射列：</span>
                    <span className="text-white ml-2">
                      {Object.values(regionMapping).filter(v => v).length} / {parsedData.priceColumns.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">目标区域：</span>
                    <span className="text-white ml-2">
                      {[...new Set(Object.values(regionMapping).filter(v => v))].length} 个区域
                    </span>
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  上一步
                </button>

                <button
                  onClick={handleImport}
                  disabled={Object.values(regionMapping).filter(v => v).length === 0 || isProcessing}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      导入中...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      开始导入
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 步骤4: 导入结果 */}
          {step === 4 && importResult && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">步骤4: 导入完成</h3>
                <p className="text-gray-400 text-sm mb-4">
                  批量价格导入已完成。请查看导入结果和详细信息。
                </p>
              </div>

              {/* 导入结果摘要 */}
              <div className={`p-6 rounded-lg border ${
                importResult.success
                  ? 'bg-green-900/20 border-green-500/30'
                  : 'bg-red-900/20 border-red-500/30'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  {importResult.success ? (
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                  )}
                  <div>
                    <h4 className={`text-lg font-semibold ${
                      importResult.success ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {importResult.success ? '导入成功' : '导入失败'}
                    </h4>
                    <p className="text-gray-400 text-sm">
                      {importResult.success
                        ? `成功导入 ${importResult.summary.totalRegions} 个区域的价格配置`
                        : '导入过程中遇到错误，请检查详细信息'
                      }
                    </p>
                  </div>
                </div>

                {/* 导入统计 */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{importResult.summary.totalRegions}</div>
                    <div className="text-sm text-gray-400">导入区域</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{importResult.summary.totalRanges}</div>
                    <div className="text-sm text-gray-400">重量区间</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {importResult.importedRegions.reduce((sum, region) => sum + region.rangeCount, 0)}
                    </div>
                    <div className="text-sm text-gray-400">总价格条目</div>
                  </div>
                </div>
              </div>

              {/* 详细导入结果 */}
              {importResult.importedRegions.length > 0 && (
                <div className="bg-gray-800/50 border border-gray-600/50 rounded-lg overflow-hidden">
                  <div className="p-4 border-b border-gray-600/50">
                    <h4 className="text-white font-medium">导入详情</h4>
                  </div>
                  <div className="divide-y divide-gray-600/50">
                    {importResult.importedRegions.map((region, index) => (
                      <div key={index} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-white font-medium">{region.regionName}</span>
                            <span className="text-sm text-gray-400">({region.columnName})</span>
                          </div>
                          <span className="text-sm text-green-400">{region.rangeCount} 个区间</span>
                        </div>
                        <div className="text-sm text-gray-400">
                          价格范围: ${region.priceRange.min.toFixed(2)} - ${region.priceRange.max.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 错误信息 */}
              {importResult.errors.length > 0 && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-red-400 font-medium">导入错误</span>
                  </div>
                  <ul className="text-sm text-red-300 space-y-1">
                    {importResult.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex justify-between">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  重新导入
                </button>

                <button
                  onClick={() => {
                    onImportComplete?.(importResult);
                    onClose();
                  }}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  完成
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default BatchPriceImporter;
