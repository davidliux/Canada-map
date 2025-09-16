// Price Breakdown Component
// Simple price breakdown display component

import React from 'react';
import { DollarSign, Truck, TrendingUp } from 'lucide-react';

const PriceBreakdown = ({ calculation }) => {
  if (!calculation) {
    return null;
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: calculation.currency || 'CAD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Total Price */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-cyan-400" />
            <span className="text-gray-400">总价格</span>
          </div>
          <span className="text-2xl font-bold text-white">
            {formatCurrency(calculation.totalPrice)}
          </span>
        </div>
      </div>

      {/* Vehicle Breakdown */}
      {calculation.vehicles && calculation.vehicles.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
            <Truck className="w-4 h-4 text-cyan-400" />
            车辆分配
          </h4>
          <div className="space-y-2">
            {calculation.vehicles.map((vehicle, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-gray-400">
                  车辆 {vehicle.vehicleNumber} ({vehicle.plateCount} 板)
                </span>
                <span className="text-white">
                  {formatCurrency(vehicle.subtotal)}
                  {vehicle.priceCapped && (
                    <span className="text-yellow-400 text-xs ml-2">(已限价)</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price Components */}
      {calculation.breakdown && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            价格构成
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">基础价格</span>
              <span className="text-white">
                {formatCurrency(calculation.breakdown.basePriceTotal)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">增量价格</span>
              <span className="text-white">
                {formatCurrency(calculation.breakdown.incrementalTotal)}
              </span>
            </div>
            {calculation.breakdown.capAdjustment < 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400">价格上限调整</span>
                <span className="text-yellow-400">
                  {formatCurrency(calculation.breakdown.capAdjustment)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-gray-700">
              <span className="text-white font-semibold">最终价格</span>
              <span className="text-cyan-400 font-semibold">
                {formatCurrency(calculation.breakdown.finalTotal)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceBreakdown;