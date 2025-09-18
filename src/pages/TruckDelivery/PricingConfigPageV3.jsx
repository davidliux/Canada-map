import React, { useState } from 'react';
import { Settings, Layers, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import ConfigTargetSelector from '../../components/pricing/ConfigTargetSelector';
import PricingConfigurator from '../../components/pricing/PricingConfigurator';

const PricingConfigPageV3 = () => {
  const [selectedTargets, setSelectedTargets] = useState([]);

  const handleSelectionChange = (targets) => {
    setSelectedTargets(targets);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* 动态背景效果 */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative p-6">
        <div className="max-w-7xl mx-auto">
          {/* 页面标题 */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-500 blur-lg opacity-50"></div>
                <div className="relative bg-gradient-to-br from-cyan-500 to-purple-500 p-3 rounded-xl">
                  <Settings className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                定价配置管理中心
              </h1>
            </div>
            <p className="text-gray-400 text-lg">
              智能化管理您的城市、区域和分组定价策略
            </p>
          </motion.div>

          {/* 上下布局容器 */}
          <div className="space-y-8">
            {/* 上部：区域选择部分 */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative"
            >
              <div className="flex items-center gap-3 mb-4">
                <Layers className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-semibold text-white">步骤 1: 选择配置目标</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent"></div>
              </div>

              <ConfigTargetSelector onSelectionChange={handleSelectionChange} />
            </motion.section>

            {/* 分割线 */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center">
                <div className="bg-gray-900 px-4">
                  <div className="flex items-center gap-2 text-gray-400">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse animation-delay-200"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse animation-delay-400"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* 下部：价格配置部分 */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="w-5 h-5 text-green-400" />
                <h2 className="text-xl font-semibold text-white">步骤 2: 配置定价策略</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-green-500/20 to-transparent"></div>
              </div>

              <PricingConfigurator selectedTargets={selectedTargets} />
            </motion.section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingConfigPageV3;