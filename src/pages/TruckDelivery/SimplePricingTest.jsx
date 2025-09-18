/**
 * 简化的统一定价测试页面
 * 用于测试API集成，避免复杂的导入问题
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, DollarSign, Loader2 } from 'lucide-react';

const SimplePricingTest = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // 查询参数
  const [fsaCode, setFsaCode] = useState('M5V');
  const [skidCount, setSkidCount] = useState(5);
  const [cityId, setCityId] = useState('toronto');

  // API基础URL
  const API_BASE = 'http://localhost:5050/api/v1/pricing';

  // 查询价格
  const queryPrice = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const params = new URLSearchParams({
        fsaCode,
        skidCount: skidCount.toString(),
        cityId
      });

      const response = await fetch(`${API_BASE}/query?${params}`);
      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error?.message || '查询失败');
      }
    } catch (err) {
      setError('网络错误: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 批量查询测试
  const batchQuery = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE}/batch-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          queries: [
            { fsaCode: 'M5V', skidCount: 5 },
            { fsaCode: 'L4L', skidCount: 10 },
            { fsaCode: 'V6B', skidCount: 3 }
          ],
          commonParams: { cityId: 'toronto' }
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error?.message || '批量查询失败');
      }
    } catch (err) {
      setError('网络错误: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 头部 */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/management/truck-delivery')}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">统一定价API测试</h1>
          </div>
          <div className="text-sm text-gray-400">
            API端点: {API_BASE}
          </div>
        </div>
      </div>

      {/* 主内容 */}
      <div className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 查询表单 */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Search className="w-5 h-5 mr-2 text-cyan-500" />
              价格查询
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  FSA代码
                </label>
                <input
                  type="text"
                  value={fsaCode}
                  onChange={(e) => setFsaCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  placeholder="例如: M5V"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  板数
                </label>
                <input
                  type="number"
                  value={skidCount}
                  onChange={(e) => setSkidCount(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  城市ID
                </label>
                <input
                  type="text"
                  value={cityId}
                  onChange={(e) => setCityId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  placeholder="例如: toronto"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={queryPrice}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
                >
                  {loading ? '查询中...' : '单个查询'}
                </button>
                <button
                  onClick={batchQuery}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
                >
                  {loading ? '查询中...' : '批量查询'}
                </button>
              </div>
            </div>
          </div>

          {/* 查询结果 */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-cyan-500" />
              查询结果
            </h2>

            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
              </div>
            )}

            {error && (
              <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {result && !loading && (
              <div className="space-y-4">
                {/* 单个查询结果 */}
                {result.fsaCode && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400 text-sm">FSA代码</p>
                        <p className="text-lg font-semibold">{result.fsaCode}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">价格</p>
                        <p className="text-2xl font-bold text-cyan-400">
                          ${result.price} {result.currency}
                        </p>
                      </div>
                    </div>

                    {result.calculation && (
                      <div className="border-t border-gray-700 pt-4">
                        <p className="text-gray-400 text-sm mb-2">价格计算</p>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>基础价格:</span>
                            <span>${result.calculation.basePrice}</span>
                          </div>
                          {result.calculation.adjustments?.map((adj, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-gray-400">{adj.reason}:</span>
                              <span>${adj.amount}</span>
                            </div>
                          ))}
                          <div className="flex justify-between font-semibold pt-2 border-t border-gray-700">
                            <span>最终价格:</span>
                            <span className="text-cyan-400">${result.calculation.finalPrice}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* 批量查询结果 */}
                {result.results && (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b border-gray-700">
                          <tr>
                            <th className="text-left py-2">FSA</th>
                            <th className="text-left py-2">板数</th>
                            <th className="text-right py-2">价格</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.results.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-700/50">
                              <td className="py-2">{item.fsaCode}</td>
                              <td className="py-2">{item.skidCount}</td>
                              <td className="py-2 text-right text-cyan-400">
                                ${item.price}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {result.summary && (
                      <div className="border-t border-gray-700 pt-4 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-400">平均价格:</span>
                          <span className="ml-2">${result.summary.averagePrice}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">成功率:</span>
                          <span className="ml-2">
                            {result.summary.successful}/{result.summary.totalQueries}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* JSON视图 */}
                <details className="border-t border-gray-700 pt-4">
                  <summary className="cursor-pointer text-gray-400 hover:text-white">
                    查看完整JSON响应
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-900 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
            )}

            {!result && !loading && !error && (
              <div className="text-center py-12 text-gray-400">
                <p>输入查询参数并点击查询按钮</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimplePricingTest;