import React from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

const TruckDeliveryLayout = () => {
  // 卡车配送仪表板不需要额外的侧边栏，直接显示内容
  return (
    <div className="h-full">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="h-full"
      >
        <Outlet />
      </motion.div>
    </div>
  );
};

export default TruckDeliveryLayout;