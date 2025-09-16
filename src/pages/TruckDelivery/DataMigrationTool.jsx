/**
 * 数据迁移工具页面
 * 
 * 提供旧系统到新定价系统的数据迁移功能，支持：
 * - 旧定价数据检测和分析
 * - 数据格式转换和验证
 * - 批量迁移和回滚
 * - 迁移进度和报告
 * 
 * Tasks 40-42: 数据迁移工具
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Download,
  Upload,
  FileText,
  Eye,
  Search,
  Filter,
  Play,
  Pause,
  RotateCcw,
  Save,
  Trash2,
  Copy,
  Settings,
  BarChart3,
  Calendar,
  Clock
} from 'lucide-react';

import * as unifiedStorage from '../../utils/unifiedStorage.js';
import pricingService from '../../services/pricingService.js';
import { cityStorageService } from '../../utils/storage/cityStorage.js';
import { formatCurrency, formatDate } from '../../utils/formatting.js';

// 迁移状态
const MIGRATION_STATUS = {
  NOT_STARTED: 'not_started',
  ANALYZING: 'analyzing',
  READY: 'ready',
  MIGRATING: 'migrating',
  COMPLETED: 'completed',
  FAILED: 'failed',
  ROLLED_BACK: 'rolled_back'
};

// 数据源类型
const DATA_SOURCES = {
  LEGACY_STORAGE: 'legacy_storage',
  JSON_FILE: 'json_file',
  CSV_FILE: 'csv_file',
  API_ENDPOINT: 'api_endpoint'
};

/**
 * 进度指示器组件
 */
const ProgressIndicator = ({ current, total, label, color = 'blue' }) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-300">{label}</span>
        <span className={`text-${color}-400 font-semibold`}>
          {current}/{total} ({Math.round(percentage)}%)
        </span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={`bg-${color}-500 h-2 rounded-full transition-all duration-300`}
        />
      </div>
    </div>
  );
};

/**
 * 数据源分析器组件
 */
const DataSourceAnalyzer = ({ onAnalysisComplete }) => {
  const [selectedSource, setSelectedSource] = useState(DATA_SOURCES.LEGACY_STORAGE);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  // 分析旧存储数据
  const analyzeLegacyStorage = useCallback(async () => {
    try {
      // 获取所有区域配置
      const regionConfigs = [];
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('region_')) {
          const config = unifiedStorage.getRegionConfig(key.replace('region_', ''));
          if (config) {
            regionConfigs.push(config);
          }
        }
      }

      // 分析数据结构
      const analysis = {
        totalRegions: regionConfigs.length,
        regionsWithPricing: regionConfigs.filter(r => r.prices && Object.keys(r.prices).length > 0).length,
        weightRanges: new Set(),
        priceRanges: { min: Infinity, max: -Infinity },
        lastModified: null
      };

      regionConfigs.forEach(region => {
        if (region.prices) {
          Object.keys(region.prices).forEach(range => {
            analysis.weightRanges.add(range);
            const price = region.prices[range];
            if (price.base) {
              analysis.priceRanges.min = Math.min(analysis.priceRanges.min, price.base);
              analysis.priceRanges.max = Math.max(analysis.priceRanges.max, price.base);
            }
          });
        }
        
        if (region.lastModified) {
          const modified = new Date(region.lastModified);
          if (!analysis.lastModified || modified > analysis.lastModified) {
            analysis.lastModified = modified;
          }
        }
      });

      analysis.weightRanges = Array.from(analysis.weightRanges);
      analysis.uniqueWeightRanges = analysis.weightRanges.length;
      analysis.data = regionConfigs;

      return analysis;
    } catch (error) {
      console.error('分析旧存储数据失败:', error);
      throw new Error('无法分析旧存储数据: ' + error.message);
    }
  }, []);

  // 分析JSON文件
  const analyzeJsonFile = useCallback(async (file) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // 根据数据结构进行分析
      let regions = [];
      if (Array.isArray(data)) {
        regions = data;
      } else if (data.regions) {
        regions = data.regions;
      } else {
        throw new Error('无法识别的JSON数据结构');
      }

      const analysis = {
        totalRegions: regions.length,
        regionsWithPricing: regions.filter(r => r.prices || r.pricingRules || r.weightRanges).length,
        fileSize: file.size,
        fileName: file.name,
        data: regions
      };

      return analysis;
    } catch (error) {
      throw new Error('JSON文件解析失败: ' + error.message);
    }
  }, []);

  // 执行分析
  const performAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    setAnalysisResults(null);

    try {
      let results;
      
      switch (selectedSource) {
        case DATA_SOURCES.LEGACY_STORAGE:
          results = await analyzeLegacyStorage();
          break;
          
        case DATA_SOURCES.JSON_FILE:
          if (!uploadedFile) {
            throw new Error('请先选择JSON文件');
          }
          results = await analyzeJsonFile(uploadedFile);
          break;
          
        default:
          throw new Error('不支持的数据源类型');
      }

      results.sourceType = selectedSource;
      results.analyzedAt = new Date();
      
      setAnalysisResults(results);
      onAnalysisComplete?.(results);
      
    } catch (error) {
      console.error('数据分析失败:', error);
      setAnalysisResults({
        error: error.message,
        sourceType: selectedSource,
        analyzedAt: new Date()
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedSource, uploadedFile, analyzeLegacyStorage, analyzeJsonFile, onAnalysisComplete]);

  // 处理文件上传
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
      setAnalysisResults(null);
    }
  }, []);

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Search className="w-5 h-5 text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">数据源分析</h3>
      </div>

      {/* 数据源选择 */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">选择数据源</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex items-center p-4 border border-gray-600 rounded-lg cursor-pointer hover:border-gray-500 transition-colors">
              <input
                type="radio"
                value={DATA_SOURCES.LEGACY_STORAGE}
                checked={selectedSource === DATA_SOURCES.LEGACY_STORAGE}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
              />
              <div className="ml-3">
                <div className="text-white font-medium">旧版本存储</div>
                <div className="text-gray-400 text-sm">从浏览器本地存储读取</div>
              </div>
            </label>
            
            <label className="flex items-center p-4 border border-gray-600 rounded-lg cursor-pointer hover:border-gray-500 transition-colors">
              <input
                type="radio"
                value={DATA_SOURCES.JSON_FILE}
                checked={selectedSource === DATA_SOURCES.JSON_FILE}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
              />
              <div className="ml-3">
                <div className="text-white font-medium">JSON文件</div>
                <div className="text-gray-400 text-sm">导入JSON格式数据</div>
              </div>
            </label>
          </div>
        </div>

        {/* 文件上传 */}
        {selectedSource === DATA_SOURCES.JSON_FILE && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">选择文件</label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white 
                       file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 
                       file:text-white file:bg-blue-600 hover:file:bg-blue-500"
            />
            {uploadedFile && (
              <p className="mt-2 text-sm text-gray-400">
                已选择: {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
        )}
      </div>

      {/* 分析按钮 */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={performAnalysis}
          disabled={isAnalyzing || (selectedSource === DATA_SOURCES.JSON_FILE && !uploadedFile)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 
                   disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors text-white"
        >
          {isAnalyzing ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
          {isAnalyzing ? '分析中...' : '开始分析'}
        </button>
      </div>

      {/* 分析结果 */}
      {analysisResults && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-gray-700 pt-6"
          >
            {analysisResults.error ? (
              <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <XCircle className="w-6 h-6 text-red-400" />
                  <div>
                    <h4 className="font-semibold text-red-400">分析失败</h4>
                    <p className="text-red-300 mt-1">{analysisResults.error}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <h4 className="font-semibold text-white">分析完成</h4>
                  <span className="text-sm text-gray-400">
                    {formatDate(analysisResults.analyzedAt, 'medium')}
                  </span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400">{analysisResults.totalRegions}</div>
                    <div className="text-sm text-gray-400">总区域数</div>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-400">{analysisResults.regionsWithPricing}</div>
                    <div className="text-sm text-gray-400">有定价配置</div>
                  </div>
                  {analysisResults.uniqueWeightRanges && (
                    <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-400">{analysisResults.uniqueWeightRanges}</div>
                      <div className="text-sm text-gray-400">重量范围</div>
                    </div>
                  )}
                  {analysisResults.priceRanges && analysisResults.priceRanges.min !== Infinity && (
                    <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                      <div className="text-lg font-bold text-orange-400">
                        ${analysisResults.priceRanges.min.toFixed(0)} - ${analysisResults.priceRanges.max.toFixed(0)}
                      </div>
                      <div className="text-sm text-gray-400">价格范围</div>
                    </div>
                  )}
                </div>

                {analysisResults.lastModified && (
                  <div className="text-sm text-gray-400">
                    最后修改时间: {formatDate(analysisResults.lastModified, 'medium')}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

/**
 * 迁移执行器组件
 */
const MigrationExecutor = ({ analysisResults, onMigrationComplete }) => {
  const [migrationStatus, setMigrationStatus] = useState(MIGRATION_STATUS.NOT_STARTED);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [migrationLog, setMigrationLog] = useState([]);
  const [migrationResults, setMigrationResults] = useState(null);

  // 添加日志条目
  const addLog = useCallback((level, message, data = null) => {
    const logEntry = {
      id: Date.now(),
      timestamp: new Date(),
      level, // 'info', 'success', 'warning', 'error'
      message,
      data
    };
    setMigrationLog(prev => [...prev, logEntry]);
    console.log(`[Migration ${level.toUpperCase()}]`, message, data);
  }, []);

  // 转换旧数据格式到新格式
  const convertLegacyData = useCallback((legacyRegion) => {
    try {
      const weightRanges = [];
      
      if (legacyRegion.prices) {
        Object.entries(legacyRegion.prices).forEach(([range, pricing]) => {
          const [minWeight, maxWeight] = range.split('-').map(w => 
            w === 'unlimited' ? -1 : parseFloat(w)
          );
          
          weightRanges.push({
            min: minWeight,
            max: maxWeight,
            basePrice: pricing.base || 0,
            perKgPrice: pricing.perKg || 0
          });
        });
      }

      // 排序重量范围
      weightRanges.sort((a, b) => a.min - b.min);

      return {
        id: legacyRegion.id,
        name: legacyRegion.name || `区域 ${legacyRegion.id}`,
        cityId: legacyRegion.cityId,
        regionId: legacyRegion.id,
        weightRanges,
        isActive: true,
        lastModified: legacyRegion.lastModified || new Date().toISOString(),
        migrationSource: 'legacy_storage',
        migrationDate: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`转换区域数据失败 (${legacyRegion.id}): ${error.message}`);
    }
  }, []);

  // 执行迁移
  const executeMigration = useCallback(async () => {
    if (!analysisResults || !analysisResults.data) {
      addLog('error', '没有可迁移的数据');
      return;
    }

    setMigrationStatus(MIGRATION_STATUS.MIGRATING);
    setProgress({ current: 0, total: analysisResults.data.length });
    setMigrationResults(null);

    const results = {
      successful: [],
      failed: [],
      skipped: [],
      startTime: new Date(),
      endTime: null
    };

    try {
      addLog('info', `开始迁移 ${analysisResults.data.length} 个区域的定价数据`);

      for (let i = 0; i < analysisResults.data.length; i++) {
        const legacyRegion = analysisResults.data[i];
        
        try {
          // 转换数据格式
          const newPricingRule = convertLegacyData(legacyRegion);
          
          // 检查是否已存在
          const existingRules = await pricingService.getRegionPricing(
            newPricingRule.cityId, 
            newPricingRule.regionId
          );
          
          if (existingRules && existingRules.length > 0) {
            addLog('warning', `区域 ${legacyRegion.name} 已有定价规则，跳过迁移`);
            results.skipped.push({
              region: legacyRegion,
              reason: 'Already exists'
            });
          } else {
            // 创建新的定价规则
            await pricingService.createRule(newPricingRule);
            addLog('success', `成功迁移区域 ${legacyRegion.name} 的定价规则`);
            results.successful.push({
              region: legacyRegion,
              newRule: newPricingRule
            });
          }
          
        } catch (error) {
          addLog('error', `迁移区域 ${legacyRegion.name || legacyRegion.id} 失败: ${error.message}`);
          results.failed.push({
            region: legacyRegion,
            error: error.message
          });
        }

        setProgress({ current: i + 1, total: analysisResults.data.length });
      }

      results.endTime = new Date();
      setMigrationResults(results);
      setMigrationStatus(MIGRATION_STATUS.COMPLETED);
      
      addLog('success', 
        `迁移完成: ${results.successful.length} 成功, ${results.failed.length} 失败, ${results.skipped.length} 跳过`
      );
      
      onMigrationComplete?.(results);
      
    } catch (error) {
      setMigrationStatus(MIGRATION_STATUS.FAILED);
      addLog('error', `迁移过程发生错误: ${error.message}`);
      
      results.endTime = new Date();
      setMigrationResults(results);
    }
  }, [analysisResults, convertLegacyData, addLog, onMigrationComplete]);

  // 重置迁移状态
  const resetMigration = useCallback(() => {
    setMigrationStatus(MIGRATION_STATUS.NOT_STARTED);
    setProgress({ current: 0, total: 0 });
    setMigrationLog([]);
    setMigrationResults(null);
  }, []);

  if (!analysisResults || analysisResults.error) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <div className="text-center py-8">
          <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">等待数据分析</h3>
          <p className="text-gray-400">请先完成数据源分析后再进行迁移</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <Play className="w-5 h-5 text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">迁移执行</h3>
        </div>

        <div className="flex items-center gap-3">
          {migrationStatus === MIGRATION_STATUS.COMPLETED && (
            <button
              onClick={resetMigration}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors text-white"
            >
              <RefreshCw className="w-4 h-4" />
              重新开始
            </button>
          )}
          
          <button
            onClick={executeMigration}
            disabled={migrationStatus === MIGRATION_STATUS.MIGRATING}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 
                     disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors text-white"
          >
            {migrationStatus === MIGRATION_STATUS.MIGRATING ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Play className="w-5 h-5" />
            )}
            {migrationStatus === MIGRATION_STATUS.MIGRATING ? '迁移中...' : '开始迁移'}
          </button>
        </div>
      </div>

      {/* 进度显示 */}
      {progress.total > 0 && (
        <div className="mb-6">
          <ProgressIndicator
            current={progress.current}
            total={progress.total}
            label="迁移进度"
            color="green"
          />
        </div>
      )}

      {/* 迁移结果统计 */}
      {migrationResults && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="bg-green-900/50 border border-green-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{migrationResults.successful.length}</div>
            <div className="text-sm text-green-300">成功</div>
          </div>
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{migrationResults.failed.length}</div>
            <div className="text-sm text-red-300">失败</div>
          </div>
          <div className="bg-yellow-900/50 border border-yellow-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{migrationResults.skipped.length}</div>
            <div className="text-sm text-yellow-300">跳过</div>
          </div>
        </div>
      )}

      {/* 迁移日志 */}
      <div className="bg-gray-700/50 rounded-lg p-4 max-h-64 overflow-y-auto">
        <h4 className="font-semibold text-white mb-3">迁移日志</h4>
        {migrationLog.length > 0 ? (
          <div className="space-y-2">
            {migrationLog.slice(-20).map(log => (
              <div key={log.id} className="flex items-start gap-3 text-sm">
                <span className="text-gray-500 whitespace-nowrap">
                  {log.timestamp.toLocaleTimeString()}
                </span>
                <span className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  log.level === 'success' ? 'bg-green-400' :
                  log.level === 'error' ? 'bg-red-400' :
                  log.level === 'warning' ? 'bg-yellow-400' :
                  'bg-blue-400'
                }`} />
                <span className="text-gray-300">{log.message}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">暂无日志记录</p>
        )}
      </div>
    </div>
  );
};

/**
 * 数据迁移工具主页面
 */
const DataMigrationTool = () => {
  const [analysisResults, setAnalysisResults] = useState(null);
  const [migrationResults, setMigrationResults] = useState(null);
  const [activeTab, setActiveTab] = useState('analysis');

  const tabs = [
    { key: 'analysis', label: '数据分析', icon: Search },
    { key: 'migration', label: '执行迁移', icon: Play },
    { key: 'results', label: '迁移结果', icon: BarChart3 }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-b border-gray-700 p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-500/20 rounded-xl">
            <Database className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              数据迁移工具
            </h1>
            <p className="text-gray-300 mt-1">
              将旧版定价数据迁移到新的动态定价系统
            </p>
          </div>
        </div>

        {/* 标签切换 */}
        <div className="flex items-center mt-6">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-6xl mx-auto"
          >
            {activeTab === 'analysis' && (
              <DataSourceAnalyzer
                onAnalysisComplete={(results) => {
                  setAnalysisResults(results);
                  if (!results.error) {
                    setActiveTab('migration');
                  }
                }}
              />
            )}

            {activeTab === 'migration' && (
              <MigrationExecutor
                analysisResults={analysisResults}
                onMigrationComplete={(results) => {
                  setMigrationResults(results);
                  setActiveTab('results');
                }}
              />
            )}

            {activeTab === 'results' && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                {migrationResults ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                      <h3 className="text-lg font-semibold text-white">迁移完成</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-green-900/50 border border-green-700 rounded-lg p-6 text-center">
                        <div className="text-3xl font-bold text-green-400 mb-2">
                          {migrationResults.successful.length}
                        </div>
                        <div className="text-green-300">成功迁移</div>
                      </div>
                      
                      <div className="bg-red-900/50 border border-red-700 rounded-lg p-6 text-center">
                        <div className="text-3xl font-bold text-red-400 mb-2">
                          {migrationResults.failed.length}
                        </div>
                        <div className="text-red-300">迁移失败</div>
                      </div>
                      
                      <div className="bg-yellow-900/50 border border-yellow-700 rounded-lg p-6 text-center">
                        <div className="text-3xl font-bold text-yellow-400 mb-2">
                          {migrationResults.skipped.length}
                        </div>
                        <div className="text-yellow-300">跳过迁移</div>
                      </div>
                    </div>

                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-3">迁移详情</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">开始时间:</span>
                          <div className="text-white">{formatDate(migrationResults.startTime, 'medium')}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">结束时间:</span>
                          <div className="text-white">{formatDate(migrationResults.endTime, 'medium')}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">暂无迁移结果</h3>
                    <p className="text-gray-400">完成迁移后，结果将在此显示</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DataMigrationTool;