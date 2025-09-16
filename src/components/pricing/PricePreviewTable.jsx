// Price Preview Table Component
// Displays calculated prices for different plate counts

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp,
  Download,
  Info,
  Truck
} from 'lucide-react';
import priceCalculationEngine from '../../utils/pricing/priceCalculationEngine';

const PricePreviewTable = ({ rule, maxPlates = 20 }) => {
  const [hoveredRow, setHoveredRow] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [selectedPlateCount, setSelectedPlateCount] = useState(null);

  // Generate preview data
  const previewData = useMemo(() => {
    if (!rule) return [];
    return priceCalculationEngine.generatePreviewTable(rule, maxPlates);
  }, [rule, maxPlates]);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (previewData.length === 0) return null;

    const prices = previewData.map(d => d.price);
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    const priceIncreases = [];
    for (let i = 1; i < previewData.length; i++) {
      const increase = previewData[i].price - previewData[i - 1].price;
      priceIncreases.push(increase);
    }
    const avgIncrease = priceIncreases.reduce((sum, inc) => sum + inc, 0) / priceIncreases.length;

    return {
      avgPrice: avgPrice.toFixed(2),
      minPrice: minPrice.toFixed(2),
      maxPrice: maxPrice.toFixed(2),
      avgIncrease: avgIncrease.toFixed(2),
      totalVehicles: previewData[previewData.length - 1].vehicles,
      anomalyCount: previewData.filter(d => d.hasAnomaly).length
    };
  }, [previewData]);

  const handleExportCSV = () => {
    const headers = ['板数', '总价', '车辆数', '每板价格', '异常'];
    const rows = previewData.map(row => [
      row.plateCount,
      row.price.toFixed(2),
      row.vehicles,
      row.pricePerPlate.toFixed(2),
      row.hasAnomaly ? row.anomalyType : ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pricing_preview_${rule.name.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getAnomalyIcon = (anomalyType) => {
    switch (anomalyType) {
      case 'price_decrease':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      case 'unusual_jump':
        return <TrendingUp className="w-4 h-4 text-yellow-400" />;
      case 'cap_applied':
        return <Info className="w-4 h-4 text-blue-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getAnomalyMessage = (anomalyType) => {
    switch (anomalyType) {
      case 'price_decrease':
        return '价格下降';
      case 'unusual_jump':
        return '价格异常跳跃';
      case 'cap_applied':
        return '已应用价格上限';
      default:
        return '异常';
    }
  };

  if (!rule) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <p className="text-gray-400">请选择一个定价规则以查看预览</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistics */}
      {statistics && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">统计信息</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            <div>
              <p className="text-gray-500 text-sm">平均价格</p>
              <p className="text-white font-semibold">${statistics.avgPrice}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">最低价格</p>
              <p className="text-white font-semibold">${statistics.minPrice}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">最高价格</p>
              <p className="text-white font-semibold">${statistics.maxPrice}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">平均增量</p>
              <p className="text-white font-semibold">${statistics.avgIncrease}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">最大车辆数</p>
              <p className="text-white font-semibold">{statistics.totalVehicles}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">异常数</p>
              <p className={`font-semibold ${
                statistics.anomalyCount > 0 ? 'text-yellow-400' : 'text-white'
              }`}>
                {statistics.anomalyCount}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Table Header Actions */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">价格预览表</h3>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 
                   transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          导出CSV
        </button>
      </div>

      {/* Preview Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">板数</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">总价</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">车辆</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">每板价格</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">增量</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">状态</th>
              </tr>
            </thead>
            <tbody>
              {previewData.map((row, index) => {
                const prevRow = index > 0 ? previewData[index - 1] : null;
                const priceIncrease = prevRow ? row.price - prevRow.price : 0;
                
                return (
                  <motion.tr
                    key={row.plateCount}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={`border-t border-gray-700 transition-colors cursor-pointer ${
                      hoveredRow === index ? 'bg-gray-700/50' : ''
                    } ${row.hasAnomaly ? 'bg-yellow-900/10' : ''}`}
                    onMouseEnter={() => setHoveredRow(index)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() => {
                      setSelectedPlateCount(row.plateCount);
                      setShowBreakdown(true);
                    }}
                  >
                    <td className="px-4 py-3 text-white font-medium">{row.plateCount}</td>
                    <td className="px-4 py-3 text-right text-white">
                      ${row.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Truck className="w-4 h-4 text-gray-400" />
                        <span className="text-white">{row.vehicles}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300">
                      ${row.pricePerPlate.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {index > 0 && (
                        <span className={`${
                          priceIncrease > 0 ? 'text-green-400' : 
                          priceIncrease < 0 ? 'text-red-400' : 
                          'text-gray-400'
                        }`}>
                          {priceIncrease > 0 && '+'}${priceIncrease.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.hasAnomaly && (
                        <div className="flex items-center justify-center gap-2">
                          {getAnomalyIcon(row.anomalyType)}
                          <span className="text-xs text-gray-400">
                            {getAnomalyMessage(row.anomalyType)}
                          </span>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Breakdown Modal */}
      {showBreakdown && selectedPlateCount && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowBreakdown(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-4">
              价格明细 - {selectedPlateCount} 板
            </h3>
            
            {(() => {
              const calculation = priceCalculationEngine.getBreakdown(selectedPlateCount, rule);
              return (
                <div className="space-y-4">
                  {/* Vehicle Breakdown */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">车辆明细</h4>
                    {calculation.vehicles.map((vehicle, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
                        <span className="text-gray-400">
                          车辆 {vehicle.vehicleNumber} ({vehicle.plateCount} 板)
                        </span>
                        <div className="text-right">
                          <span className="text-white">${vehicle.subtotal.toFixed(2)}</span>
                          {vehicle.priceCapped && (
                            <span className="text-yellow-400 text-xs ml-2">(已限价)</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Price Breakdown */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">价格构成</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">基础价格合计</span>
                        <span className="text-white">${calculation.breakdown.basePriceTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">增量价格合计</span>
                        <span className="text-white">${calculation.breakdown.incrementalTotal.toFixed(2)}</span>
                      </div>
                      {calculation.breakdown.capAdjustment < 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">价格上限调整</span>
                          <span className="text-yellow-400">{calculation.breakdown.capAdjustment.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t border-gray-700">
                        <span className="text-white font-semibold">最终价格</span>
                        <span className="text-cyan-400 font-semibold">${calculation.breakdown.finalTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Configuration Details */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">配置详情</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">基础范围:</span>
                        <span className="text-gray-300 ml-2">{calculation.details.baseConfiguration.plateRange}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">基础价格:</span>
                        <span className="text-gray-300 ml-2">${calculation.details.baseConfiguration.price}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">增量类型:</span>
                        <span className="text-gray-300 ml-2">{calculation.details.incrementConfiguration.type}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">每车容量:</span>
                        <span className="text-gray-300 ml-2">{calculation.details.vehicleConfiguration.maxPlatesPerVehicle} 板</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowBreakdown(false)}
                    className="w-full px-4 py-2 bg-gray-700 text-gray-300 rounded-lg 
                             hover:bg-gray-600 transition-colors"
                  >
                    关闭
                  </button>
                </div>
              );
            })()}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PricePreviewTable;