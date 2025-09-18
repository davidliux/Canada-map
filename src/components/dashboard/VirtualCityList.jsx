import React from 'react';
const FixedSizeList = React.lazy(() => import('react-window').then(module => ({ default: module.FixedSizeList })));
import CompactCityCard from './CompactCityCard';

/**
 * 虚拟滚动城市列表组件
 * 使用react-window实现虚拟滚动，支持100+城市的流畅滚动
 * Requirements: NFR-001, NFR-004
 */
const VirtualCityList = ({
  cities = [],
  selectedCity = null,
  onCitySelect,
  className = ''
}) => {
  // 渲染单个城市项
  const Row = ({ index, style }) => {
    const city = cities[index];
    if (!city) return null;

    return (
      <div style={style} className="px-4 py-1">
        <CompactCityCard
          city={city}
          isSelected={selectedCity?.id === city.id}
          onClick={() => onCitySelect(city)}
        />
      </div>
    );
  };

  // 计算列表高度（需要减去padding等）
  const getListHeight = () => {
    // 获取容器的实际高度
    const container = document.querySelector('.virtual-list-container');
    if (container) {
      return container.clientHeight;
    }
    // 默认高度
    return window.innerHeight - 200;
  };

  return (
    <div className={`virtual-list-container h-full ${className}`}>
      <FixedSizeList
        height={getListHeight()}
        itemCount={cities.length}
        itemSize={88} // 80px card height + 8px gap
        width="100%"
        overscanCount={3} // 预渲染3个额外的项目以改善滚动体验
      >
        {Row}
      </FixedSizeList>
    </div>
  );
};

export default VirtualCityList;