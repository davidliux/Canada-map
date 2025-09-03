import React from 'react';
import { motion } from 'framer-motion';
import { Package, MapPin, BarChart3, Truck } from 'lucide-react';
import { getDeliveryStats, getFSAsByProvince } from '../data/deliverableFSA';

const DeliveryStats = () => {
  const stats = getDeliveryStats();
  const fsasByProvince = getFSAsByProvince();
  
  // 调试信息
  console.log('DeliveryStats - stats:', stats);
  console.log('DeliveryStats - 总数应该是806:', stats.total === 806);

  // 获取前5个省份
  const topProvinces = Object.entries(stats.byProvince)
    .filter(([province, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const provinceNames = {
    'BC': '不列颠哥伦比亚省',
    'ON': '安大略省',
    'QC': '魁北克省',
    'AB': '阿尔伯塔省',
    'MB': '马尼托巴省',
    'SK': '萨斯喀彻温省',
    'NS': '新斯科舍省',
    'NB': '新不伦瑞克省',
    'NL': '纽芬兰和拉布拉多省',
    'PE': '爱德华王子岛省',
    'YT': '育空地区',
    'NT': '西北地区',
    'NU': '努纳武特地区'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
    >
      {/* 总体统计 */}
      <div className="bg-cyber-gray rounded-xl p-6 border border-cyber-blue/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center">
            <Package className="w-5 h-5 mr-2 text-cyber-blue" />
            可送达邮编统计
          </h3>
          <div className="bg-cyber-blue/20 p-2 rounded-lg">
            <Truck className="w-5 h-5 text-cyber-blue" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">{stats.total}</div>
            <div className="text-sm text-gray-400">可送达FSA区域</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-cyber-blue">
              {Object.keys(stats.byProvince).filter(p => stats.byProvince[p] > 0).length}
            </div>
            <div className="text-sm text-gray-400">覆盖省份</div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-cyber-dark rounded-lg">
          <div className="text-xs text-gray-300">
            <strong className="text-green-400">✓ 已整合用户真实邮编数据</strong><br/>
            数据来源：用户提供的邮编.md文件<br/>
            覆盖范围：全加拿大 {stats.total} 个FSA前向分拣区
          </div>
        </div>
      </div>

      {/* 省份分布 */}
      <div className="bg-cyber-gray rounded-xl p-6 border border-cyber-blue/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-cyber-blue" />
            省份分布
          </h3>
          <div className="bg-cyber-blue/20 p-2 rounded-lg">
            <MapPin className="w-5 h-5 text-cyber-blue" />
          </div>
        </div>

        <div className="space-y-3">
          {topProvinces.map(([province, count]) => {
            const percentage = ((count / stats.total) * 100).toFixed(1);
            return (
              <div key={province} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-cyber-blue rounded-full"></div>
                  <div>
                    <div className="text-white font-medium">{province}</div>
                    <div className="text-xs text-gray-400">
                      {provinceNames[province] || province}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-bold">{count}</div>
                  <div className="text-xs text-gray-400">{percentage}%</div>
                </div>
              </div>
            );
          })}
        </div>

        {topProvinces.length === 0 && (
          <div className="text-center text-gray-400 py-4">
            暂无数据
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DeliveryStats; 