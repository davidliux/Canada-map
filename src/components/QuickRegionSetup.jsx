import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Database,
  CheckCircle,
  AlertTriangle,
  Loader,
  Package
} from 'lucide-react';
import { apiPost, apiPut, apiGet } from '../utils/apiClient';
import { testRegionFSAs } from '../utils/testRegionData';

const QuickRegionSetup = ({ onComplete, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 5 });

  // 默认价格配置模板
  const defaultPriceTemplate = [
    { rangeName: '0-10 KGS', minWeight: 0, maxWeight: 10, price: 15.99, isActive: true },
    { rangeName: '10-20 KGS', minWeight: 10.001, maxWeight: 20, price: 25.99, isActive: true },
    { rangeName: '20-50 KGS', minWeight: 20.001, maxWeight: 50, price: 45.99, isActive: true },
    { rangeName: '50-100 KGS', minWeight: 50.001, maxWeight: 100, price: 85.99, isActive: true },
    { rangeName: '100+ KGS', minWeight: 100.001, maxWeight: 9999, price: 150.99, isActive: true }
  ];

  // 区域定义
  const regions = [
    { id: '1', name: '区域1 - Calgary核心', color: '#3B82F6', description: 'Calgary核心配送区' },
    { id: '2', name: '区域2 - Calgary外围', color: '#10B981', description: 'Calgary外围配送区' },
    { id: '3', name: '区域3 - Edmonton', color: '#F59E0B', description: 'Edmonton配送区' },
    { id: '4', name: '区域4 - Vancouver核心', color: '#EF4444', description: 'Vancouver核心配送区' },
    { id: '5', name: '区域5 - Toronto核心', color: '#8B5CF6', description: 'Toronto核心配送区' }
  ];

  const handleQuickSetup = async () => {
    setLoading(true);
    setStatus(null);
    setProgress({ current: 0, total: 5 });

    try {
      const results = [];

      for (let i = 0; i < regions.length; i++) {
        const region = regions[i];
        setProgress({ current: i + 1, total: 5 });

        try {
          // 检查区域是否存在
          let regionExists = false;
          try {
            await apiGet(`/regions/${region.id}`);
            regionExists = true;
          } catch (e) {
            // 区域不存在
          }

          // 获取对应的FSA列表
          const fsaList = testRegionFSAs[region.id] || [];

          if (regionExists) {
            // 更新现有区域
            await apiPut(`/regions/${region.id}`, {
              name: region.name,
              isActive: true,
              postalCodes: fsaList,
              weightRanges: defaultPriceTemplate
            });
            results.push({ region: region.name, status: 'updated' });
          } else {
            // 创建新区域
            await apiPost('/regions', {
              id: region.id,
              name: region.name,
              isActive: true,
              postalCodes: fsaList,
              weightRanges: defaultPriceTemplate
            });
            results.push({ region: region.name, status: 'created' });
          }
        } catch (error) {
          console.error(`处理${region.name}失败:`, error);
          results.push({ region: region.name, status: 'failed', error: error.message });
        }
      }

      // 检查结果
      const successCount = results.filter(r => r.status !== 'failed').length;
      const failedCount = results.filter(r => r.status === 'failed').length;

      if (successCount === 5) {
        setStatus({
          type: 'success',
          message: `成功配置所有5个区域！`,
          details: results
        });
      } else if (successCount > 0) {
        setStatus({
          type: 'warning',
          message: `部分成功：${successCount}个区域配置成功，${failedCount}个失败`,
          details: results
        });
      } else {
        setStatus({
          type: 'error',
          message: '配置失败，请检查后重试',
          details: results
        });
      }

      // 触发刷新
      if (successCount > 0) {
        onComplete?.();
        onRefresh?.();
      }
    } catch (error) {
      console.error('批量设置失败:', error);
      setStatus({
        type: 'error',
        message: `批量设置失败: ${error.message}`
      });
    } finally {
      setLoading(false);
      setProgress({ current: 0, total: 5 });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">快速配置区域1-5</h3>
            <p className="text-sm text-gray-400">一键初始化5个主要配送区域的价格配置</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-400">5</div>
          <div className="text-xs text-gray-400">个区域</div>
        </div>
      </div>

      {/* 区域预览 */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {regions.map((region, index) => (
          <div
            key={region.id}
            className={`p-2 rounded-lg border transition-all ${
              loading && progress.current > index
                ? 'bg-green-500/20 border-green-500/50'
                : 'bg-gray-800/50 border-gray-700/50'
            }`}
          >
            <div
              className="w-3 h-3 rounded-full mb-1 mx-auto"
              style={{ backgroundColor: region.color }}
            />
            <div className="text-xs text-center text-gray-300">{region.id}区</div>
            {loading && progress.current === index + 1 && (
              <Loader className="w-3 h-3 mx-auto mt-1 text-blue-400 animate-spin" />
            )}
            {loading && progress.current > index && (
              <CheckCircle className="w-3 h-3 mx-auto mt-1 text-green-400" />
            )}
          </div>
        ))}
      </div>

      {/* 配置信息 */}
      <div className="bg-gray-800/30 rounded-lg p-3 mb-4">
        <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
          <Package className="w-4 h-4" />
          默认价格配置
        </h4>
        <div className="grid grid-cols-5 gap-2 text-xs">
          {defaultPriceTemplate.map((range, index) => (
            <div key={index} className="p-2 bg-gray-900/50 rounded border border-gray-700/50">
              <div className="text-gray-400">{range.rangeName}</div>
              <div className="text-green-400 font-bold">${range.price}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 进度条 */}
      {loading && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>配置进度</span>
            <span>{progress.current} / {progress.total}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(progress.current / progress.total) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* 状态消息 */}
      {status && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded-lg mb-4 ${
            status.type === 'success'
              ? 'bg-green-500/20 border border-green-500/30'
              : status.type === 'warning'
              ? 'bg-yellow-500/20 border border-yellow-500/30'
              : 'bg-red-500/20 border border-red-500/30'
          }`}
        >
          <div className="flex items-start gap-2">
            {status.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                status.type === 'warning' ? 'text-yellow-400' : 'text-red-400'
              }`} />
            )}
            <div className="flex-1">
              <p className={`text-sm font-semibold ${
                status.type === 'success'
                  ? 'text-green-300'
                  : status.type === 'warning'
                  ? 'text-yellow-300'
                  : 'text-red-300'
              }`}>
                {status.message}
              </p>
              {status.details && (
                <div className="mt-2 space-y-1">
                  {status.details.map((detail, index) => (
                    <div key={index} className="text-xs text-gray-400">
                      {detail.region}: {
                        detail.status === 'created' ? '✅ 已创建' :
                        detail.status === 'updated' ? '🔄 已更新' :
                        `❌ 失败 (${detail.error})`
                      }
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <button
          onClick={handleQuickSetup}
          disabled={loading}
          className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
            loading
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
          }`}
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              配置中...
            </>
          ) : (
            <>
              <Database className="w-5 h-5" />
              一键初始化区域1-5
            </>
          )}
        </button>
      </div>

      {/* 提示信息 */}
      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-xs text-blue-300">
          <strong>提示：</strong>此操作将为区域1-5创建或更新价格配置，包括FSA分配和重量区间定价。
          每个区域将使用相同的默认价格模板，你可以在配置完成后单独调整每个区域的价格。
        </p>
      </div>
    </motion.div>
  );
};

export default QuickRegionSetup;