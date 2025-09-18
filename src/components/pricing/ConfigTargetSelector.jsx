import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Users,
  Activity,
  Sparkles,
  Zap,
  Globe,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '../ui/accordion';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

const ConfigTargetSelector = ({ onSelectionChange }) => {
  const [cities, setCities] = useState([]);
  const [zones, setZones] = useState({});
  const [groups, setGroups] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [activeTab, setActiveTab] = useState('selection');

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedItems);
    }
  }, [selectedItems, onSelectionChange]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const citiesResponse = await fetch('/api/v1/truck-delivery/cities');
      const citiesData = await citiesResponse.json();

      if (citiesData.success) {
        setCities(citiesData.data);

        const zonesTemp = {};
        const groupsTemp = {};

        for (const city of citiesData.data) {
          // 加载区域
          try {
            const zonesResp = await fetch(`/api/v1/truck-delivery/zones?city_id=${city.id}`);
            const zonesData = await zonesResp.json();
            if (zonesData.success) {
              zonesTemp[city.id] = zonesData.data || [];
            }
          } catch (error) {
            console.error(`Failed to load zones for city ${city.id}:`, error);
            zonesTemp[city.id] = [];
          }

          // 加载分组
          try {
            const groupsResp = await fetch(`/api/v1/truck-delivery/fsa-groups?city_id=${city.id}`);
            const groupsData = await groupsResp.json();
            if (groupsData.success) {
              const groupsByZone = {};
              (groupsData.data || []).forEach(group => {
                if (group.zone_id) {
                  if (!groupsByZone[group.zone_id]) {
                    groupsByZone[group.zone_id] = [];
                  }
                  groupsByZone[group.zone_id].push(group);
                }
              });
              groupsTemp[city.id] = groupsByZone;
            }
          } catch (error) {
            console.error(`Failed to load groups for city ${city.id}:`, error);
            groupsTemp[city.id] = {};
          }
        }

        setZones(zonesTemp);
        setGroups(groupsTemp);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelection = (type, id, cityId = null, zoneId = null) => {
    const itemKey = `${type}_${id}_${cityId || ''}_${zoneId || ''}`;

    setSelectedItems(prev => {
      const isSelected = prev.some(item => item.key === itemKey);

      if (isSelected) {
        if (type === 'city') {
          return prev.filter(item => {
            if (item.key === itemKey) return false;
            if (item.cityId === id) return false;
            return true;
          });
        } else {
          return prev.filter(item => item.key !== itemKey);
        }
      } else {
        const newItem = {
          key: itemKey,
          type,
          id,
          cityId: cityId || id,
          zoneId: zoneId,
          name: type === 'city' ? cities.find(c => c.id === id)?.name :
                type === 'zone' ? zones[cityId]?.find(z => z.id === id)?.name :
                (() => {
                  if (groups[cityId]) {
                    for (const zone in groups[cityId]) {
                      const group = groups[cityId][zone]?.find(g => g.id === id);
                      if (group) return group.name;
                    }
                  }
                  return '';
                })(),
          level: type === 'group' ? 3 : type === 'zone' ? 2 : 1
        };

        return [...prev, newItem];
      }
    });
  };

  const isItemSelected = (type, id, cityId = null, zoneId = null) => {
    const itemKey = `${type}_${id}_${cityId || ''}_${zoneId || ''}`;
    return selectedItems.some(item => item.key === itemKey || item.key === `${type}_${id}_${cityId || ''}_`);
  };

  const getSelectedCount = () => {
    const counts = {
      cities: selectedItems.filter(item => item.type === 'city').length,
      zones: selectedItems.filter(item => item.type === 'zone').length,
      groups: selectedItems.filter(item => item.type === 'group').length
    };
    return counts;
  };

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 border border-gray-700">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-cyan-500/10 animate-pulse" />
        <div className="relative space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 animate-pulse" />
            <div>
              <div className="h-6 w-48 bg-gray-800 rounded animate-pulse mb-2" />
              <div className="h-4 w-32 bg-gray-800 rounded animate-pulse" />
            </div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const counts = getSelectedCount();

  return (
    <div className="space-y-6">
      {/* 头部区域 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 border border-gray-700"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-cyan-500/5" />

        {/* 动态背景效果 */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-conic from-cyan-500/20 via-purple-500/20 to-cyan-500/20 animate-spin-slow" />
        </div>

        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-500 blur-xl opacity-50" />
                <div className="relative h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                  <Layers className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  定价配置目标选择
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                  选择要配置定价的城市、区域或分组
                </p>
              </div>
            </div>

            {/* 选择统计 */}
            <div className="flex items-center gap-3">
              {counts.cities > 0 && (
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 px-3 py-1">
                  <Building2 className="w-3 h-3 mr-1" />
                  {counts.cities} 城市
                </Badge>
              )}
              {counts.zones > 0 && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-3 py-1">
                  <MapPin className="w-3 h-3 mr-1" />
                  {counts.zones} 区域
                </Badge>
              )}
              {counts.groups > 0 && (
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 px-3 py-1">
                  <Users className="w-3 h-3 mr-1" />
                  {counts.groups} 分组
                </Badge>
              )}
            </div>
          </div>

          {/* 快捷操作 */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setSelectedItems([])}
              className="px-3 py-1.5 text-xs bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 rounded-lg border border-gray-700 transition-all"
            >
              清除所有选择
            </button>
          </div>
        </div>
      </motion.div>

      {/* 主体选择区域 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur border border-gray-700 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-cyan-500/10 h-1" />

        <div className="p-6">
          <Accordion type="single" collapsible className="space-y-3">
            {cities.map((city, index) => (
              <AccordionItem
                key={city.id}
                value={city.id}
                className="border border-gray-700 rounded-xl overflow-hidden bg-gray-800/30 backdrop-blur"
              >
                <div className="flex items-center px-6 py-4 hover:bg-gray-700/30 transition-all group">
                  {/* 城市选择复选框 - 放在 AccordionTrigger 外部 */}
                  <div className="mr-4">
                    <Checkbox
                      checked={isItemSelected('city', city.id)}
                      onCheckedChange={() => handleItemSelection('city', city.id)}
                      className="border-cyan-500/50 data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-cyan-500 data-[state=checked]:to-purple-500"
                    />
                  </div>

                  {/* AccordionTrigger 按钮 */}
                  <AccordionTrigger className="flex-1 py-0 pr-0 hover:no-underline">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="absolute inset-0 bg-blue-500 blur-md opacity-30" />
                          <Building2 className="w-5 h-5 text-blue-400 relative" />
                        </div>
                        <span className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
                          {city.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mr-4">
                        {zones[city.id]?.length > 0 && (
                          <Badge className="bg-gray-700/50 text-gray-300 border-gray-600">
                            {zones[city.id].length} 区域
                          </Badge>
                        )}
                        <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                      </div>
                    </div>
                  </AccordionTrigger>
                </div>

                <AccordionContent className="px-6 pb-4">
                  <div className="space-y-2 mt-2">
                    {zones[city.id]?.map((zone) => (
                      <motion.div
                        key={zone.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="rounded-lg bg-gray-800/50 backdrop-blur border border-gray-700 overflow-hidden"
                      >
                        {/* 区域 */}
                        <div className="p-4 hover:bg-gray-700/30 transition-all">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={isItemSelected('zone', zone.id, city.id)}
                                onCheckedChange={() => handleItemSelection('zone', zone.id, city.id)}
                                className="border-green-500/50 data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-green-500 data-[state=checked]:to-emerald-500"
                              />
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <div className="absolute inset-0 bg-green-500 blur-md opacity-30" />
                                  <MapPin className="w-4 h-4 text-green-400 relative" />
                                </div>
                                <span className="text-white font-medium">{zone.name}</span>
                              </div>
                            </div>
                            {groups[city.id]?.[zone.id]?.length > 0 && (
                              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                                {groups[city.id][zone.id].length} 分组
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* 分组 */}
                        {groups[city.id]?.[zone.id]?.length > 0 && (
                          <div className="border-t border-gray-700 bg-gray-900/30">
                            <div className="p-4 space-y-2">
                              <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                                <Sparkles className="w-3 h-3" />
                                FSA 分组
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {groups[city.id][zone.id].map(group => (
                                  <label
                                    key={group.id}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-purple-500/50 transition-all cursor-pointer group"
                                  >
                                    <Checkbox
                                      checked={isItemSelected('group', group.id, city.id, zone.id)}
                                      onCheckedChange={() => handleItemSelection('group', group.id, city.id, zone.id)}
                                      className="border-purple-500/50 data-[state=checked]:bg-gradient-to-br data-[state=checked]:from-purple-500 data-[state=checked]:to-pink-500"
                                    />
                                    <div className="flex items-center gap-2 flex-1">
                                      <div className="relative">
                                        <div className="absolute inset-0 bg-purple-500 blur-md opacity-30" />
                                        <Users className="w-3.5 h-3.5 text-purple-400 relative" />
                                      </div>
                                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                                        {group.name}
                                      </span>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}

                    {zones[city.id]?.length === 0 && (
                      <div className="py-8 text-center text-gray-500">
                        <Globe className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">暂无区域配置</p>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </motion.div>
    </div>
  );
};

export default ConfigTargetSelector;