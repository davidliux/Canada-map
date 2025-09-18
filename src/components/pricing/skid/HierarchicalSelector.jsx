import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, Check, Building2, MapPin, Package } from 'lucide-react';

const HierarchicalSelector = ({
  cities = [],
  onSelectionChange,
  initialSelection = null,
  className = ''
}) => {
  const [selectedCity, setSelectedCity] = useState(initialSelection?.selectedCity || null);
  const [selectedZones, setSelectedZones] = useState(initialSelection?.selectedZones || []);
  const [selectedGroups, setSelectedGroups] = useState(initialSelection?.selectedGroups || []);
  const [selectionLevel, setSelectionLevel] = useState('city');
  const [expandedSections, setExpandedSections] = useState({
    zones: true,
    groups: true
  });

  // 获取当前城市的所有区域
  const availableZones = useMemo(() => {
    if (!selectedCity) return [];
    return selectedCity.zones || [];
  }, [selectedCity]);

  // 获取选中区域的所有分组
  const availableGroups = useMemo(() => {
    if (selectedZones.length === 0) {
      // 如果没有选中区域，显示整个城市的所有分组
      if (!selectedCity) return [];
      return availableZones.flatMap(zone => zone.groups || []);
    }
    return selectedZones.flatMap(zone => zone.groups || []);
  }, [selectedZones, selectedCity, availableZones]);

  // 通知父组件选择变化
  useEffect(() => {
    const selection = {
      selectedCity,
      selectedZones,
      selectedGroups,
      selectionLevel
    };
    onSelectionChange?.(selection);
  }, [selectedCity, selectedZones, selectedGroups, selectionLevel]);

  // 处理城市选择
  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setSelectedZones([]);
    setSelectedGroups([]);
    setSelectionLevel('city');
  };

  // 处理区域选择
  const handleZoneToggle = (zone) => {
    const isSelected = selectedZones.some(z => z.id === zone.id);

    if (isSelected) {
      setSelectedZones(selectedZones.filter(z => z.id !== zone.id));
      // 移除该区域下的所有分组
      const zoneGroupIds = zone.groups?.map(g => g.id) || [];
      setSelectedGroups(selectedGroups.filter(g => !zoneGroupIds.includes(g.id)));
    } else {
      setSelectedZones([...selectedZones, zone]);
    }
    setSelectionLevel('zone');
  };

  // 处理分组选择
  const handleGroupToggle = (group) => {
    const isSelected = selectedGroups.some(g => g.id === group.id);

    if (isSelected) {
      setSelectedGroups(selectedGroups.filter(g => g.id !== group.id));
    } else {
      setSelectedGroups([...selectedGroups, group]);
    }
    setSelectionLevel('group');
  };

  // 全选/取消全选区域
  const handleSelectAllZones = () => {
    if (selectedZones.length === availableZones.length) {
      setSelectedZones([]);
      setSelectedGroups([]);
    } else {
      setSelectedZones(availableZones);
      setSelectionLevel('zone');
    }
  };

  // 全选/取消全选分组
  const handleSelectAllGroups = () => {
    if (selectedGroups.length === availableGroups.length) {
      setSelectedGroups([]);
    } else {
      setSelectedGroups(availableGroups);
      setSelectionLevel('group');
    }
  };

  // 获取选择摘要文本
  const getSelectionSummary = () => {
    if (selectionLevel === 'group' && selectedGroups.length > 0) {
      return `已选择 ${selectedGroups.length} 个分组`;
    }
    if (selectionLevel === 'zone' && selectedZones.length > 0) {
      return `已选择 ${selectedZones.length} 个区域`;
    }
    if (selectedCity) {
      return `整个${selectedCity.name}`;
    }
    return '请选择城市';
  };

  return (
    <div className={`hierarchical-selector space-y-4 ${className}`}>
      {/* 城市选择器 - 最大尺寸 */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-white">选择城市</h3>
          </div>
          <span className="text-sm text-gray-400">{getSelectionSummary()}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {cities.map(city => (
            <button
              key={city.id}
              onClick={() => handleCitySelect(city)}
              className={`
                px-6 py-3 rounded-lg font-medium transition-all text-base
                ${selectedCity?.id === city.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }
              `}
            >
              {city.name}
              {city.hasCustomPricing && (
                <span className="ml-2 text-xs bg-green-600/20 px-2 py-0.5 rounded">
                  已配置
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 区域选择器 - 中等尺寸 */}
      {selectedCity && (
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setExpandedSections({...expandedSections, zones: !expandedSections.zones})}
            >
              <ChevronRight
                className={`w-4 h-4 text-gray-400 transition-transform ${expandedSections.zones ? 'rotate-90' : ''}`}
              />
              <MapPin className="w-4 h-4 text-orange-500" />
              <h3 className="text-base font-medium text-white">
                {selectedCity.name}区域 ({availableZones.length})
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAllZones}
                className="text-xs px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-gray-300"
              >
                {selectedZones.length === availableZones.length ? '取消全选' : '全选'}
              </button>
            </div>
          </div>

          {expandedSections.zones && (
            <div className="grid grid-cols-4 gap-2">
              {availableZones.map(zone => {
                const isSelected = selectedZones.some(z => z.id === zone.id);
                return (
                  <div
                    key={zone.id}
                    onClick={() => handleZoneToggle(zone)}
                    className={`
                      p-3 rounded-lg cursor-pointer transition-all
                      ${isSelected
                        ? 'bg-orange-600/20 border-orange-500 border'
                        : 'bg-gray-800 border-gray-700 border hover:bg-gray-700'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm text-white">{zone.name}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {zone.groups?.length || 0} 分组
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-orange-500" />
                      )}
                    </div>
                    {zone.hasCustomPricing && (
                      <div className="mt-2 text-xs text-green-400">已配置</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 分组选择器 - 最小尺寸 */}
      {selectedCity && availableGroups.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setExpandedSections({...expandedSections, groups: !expandedSections.groups})}
            >
              <ChevronRight
                className={`w-4 h-4 text-gray-400 transition-transform ${expandedSections.groups ? 'rotate-90' : ''}`}
              />
              <Package className="w-4 h-4 text-purple-500" />
              <h3 className="text-sm font-medium text-white">
                分组列表 ({availableGroups.length})
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAllGroups}
                className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-gray-300"
              >
                {selectedGroups.length === availableGroups.length ? '取消全选' : '全选'}
              </button>
              <button
                onClick={() => setSelectedGroups([])}
                className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-gray-300"
              >
                清空
              </button>
            </div>
          </div>

          {expandedSections.groups && (
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {availableGroups.map(group => {
                const isSelected = selectedGroups.some(g => g.id === group.id);
                return (
                  <div
                    key={group.id}
                    onClick={() => handleGroupToggle(group)}
                    className={`
                      px-3 py-2 rounded cursor-pointer transition-all text-sm
                      flex items-center justify-between
                      ${isSelected
                        ? 'bg-purple-600/20 border-l-2 border-purple-500'
                        : 'bg-gray-800/50 hover:bg-gray-800 border-l-2 border-transparent'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 text-purple-600 rounded border-gray-600 bg-gray-700"
                      />
                      <div>
                        <span className="text-white font-medium">{group.name}</span>
                        <span className="text-gray-400 text-xs ml-2">
                          ({group.fsaCodes?.join(', ') || '无FSA'})
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      {group.currentPricing ? (
                        <span className="text-green-400">
                          {group.currentPricing.mode === 'fixed' && '固定价格'}
                          {group.currentPricing.mode === 'progressive' && '首续托'}
                          {group.currentPricing.mode === 'tiered' && '阶梯定价'}
                          {group.currentPricing.mode === 'truckload' && '整车定价'}
                        </span>
                      ) : (
                        <span className="text-gray-500">未设置</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 当前选择信息 */}
      {selectedCity && (
        <div className="bg-gray-800/50 rounded-lg p-3 text-sm">
          <div className="text-gray-400">当前选择路径:</div>
          <div className="text-white font-medium mt-1">
            {selectedCity.name}
            {selectedZones.length > 0 && (
              <>
                {' → '}
                {selectedZones.length === 1
                  ? selectedZones[0].name
                  : `${selectedZones.length} 个区域`
                }
              </>
            )}
            {selectedGroups.length > 0 && (
              <>
                {' → '}
                {selectedGroups.length === 1
                  ? selectedGroups[0].name
                  : `${selectedGroups.length} 个分组`
                }
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HierarchicalSelector;