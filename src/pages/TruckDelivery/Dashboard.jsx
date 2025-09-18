import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import TruckDeliveryMap from '../../components/TruckDeliveryMap';
import { cityApi, zoneApi } from '../../services/truckDeliveryApi';
import { completeFSAData } from '../../data/canadaFSAData';
import { getRegionFSAGroups } from '../../utils/unifiedStorage';
import FSAPricingPanelV2 from '../../components/FSAPricingPanelV2';
import RegionColorLegend from '../../components/RegionColorLegend';

// 新的Dashboard组件
import CityListPanel from '../../components/dashboard/CityListPanel';
import RegionTabs from '../../components/dashboard/RegionTabs';
import DashboardErrorBoundary from '../../components/dashboard/DashboardErrorBoundary';
import LoadingState from '../../components/dashboard/LoadingState';
import EmptyState from '../../components/dashboard/EmptyState';

import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Truck,
  Activity,
  Shield,
  MapPin,
  BarChart3
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const TruckDeliveryDashboard = () => {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [cityRegions, setCityRegions] = useState([]);
  const [highlightedFSAs, setHighlightedFSAs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allConfiguredFSAs, setAllConfiguredFSAs] = useState([]); // 所有已配置的FSA
  const [selectedRegion, setSelectedRegion] = useState(null); // 新增：选中的区域
  const [regionFSAGroups, setRegionFSAGroups] = useState([]); // 区域的FSA分组
  const [selectedGroup, setSelectedGroup] = useState(null); // 新增：选中的分组
  const [pricingPanelOpen, setPricingPanelOpen] = useState(false);
  const [selectedFSAForPricing, setSelectedFSAForPricing] = useState(null);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  // 加载城市和区域数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('开始加载城市数据...');
        // 从后端API加载城市数据，包含区域信息
        const citiesData = await cityApi.getAll(true);
        console.log('API返回的城市数据:', citiesData);

        // 对于每个城市，获取其详细的区域信息
        const citiesWithRegions = await Promise.all(
          citiesData.map(async (city) => {
            try {
              console.log(`获取城市 ${city.name} 的详细信息...`);
              // 获取城市详情，包含zones
              const cityDetail = await cityApi.getById(city.id);
              console.log(`城市 ${city.name} 详情:`, cityDetail);

              // 对每个zone加载FSA分组数据
              let processedZones = [];
              if (cityDetail.zones && cityDetail.zones.length > 0) {
                processedZones = await Promise.all(cityDetail.zones.map(async (zone) => {
                  let calculatedFSAs = [];

                  // 优先使用后端计算的FSA数据
                  if (zone.calculated_fsa_codes && zone.calculated_fsa_codes.length > 0) {
                    calculatedFSAs = zone.calculated_fsa_codes;
                    console.log(`区域 ${zone.name || zone.id} 使用后端计算的 ${calculatedFSAs.length} 个FSA`);
                  } else {
                    // 如果后端没有计算数据，尝试从分组加载
                    try {
                      const groups = await getRegionFSAGroups(zone.id);
                      if (groups && groups.length > 0) {
                        const allFSAs = new Set();
                        groups.forEach(group => {
                          const fsaCodes = group.fsaCodes || [];
                          fsaCodes.forEach(fsa => allFSAs.add(fsa));
                        });
                        calculatedFSAs = Array.from(allFSAs).sort();
                        console.log(`区域 ${zone.name || zone.id} 从分组加载了 ${calculatedFSAs.length} 个FSA`);
                      }
                    } catch (err) {
                      console.error(`加载区域 ${zone.name || zone.id} 的FSA分组失败:`, err);
                    }
                  }

                  // 使用计算出的FSA或原始数据
                  const finalFSAs = calculatedFSAs.length > 0
                    ? calculatedFSAs
                    : (zone.fsaCodes || zone.fsa_codes || []);

                  return {
                    ...zone,
                    fsaCodes: finalFSAs,
                    fsa_codes: finalFSAs
                  };
                }));
              }

              return {
                ...city,
                regions: processedZones,
                totalRegions: processedZones.length,
                totalFSAs: processedZones.reduce((sum, zone) =>
                  sum + (zone.fsaCodes?.length || 0), 0)
              };
            } catch (err) {
              console.error(`获取城市 ${city.name} 详情失败:`, err);
              return {
                ...city,
                regions: [],
                totalRegions: 0,
                totalFSAs: 0
              };
            }
          })
        );

        console.log('处理后的城市数据:', citiesWithRegions);

        // 规范化城市数据中的区域字段名（snake_case 转 camelCase）
        const normalizedCities = citiesWithRegions.map(city => ({
          ...city,
          regions: (city.regions || []).map(region => ({
            ...region,
            // 确保使用camelCase的fsaCodes字段
            fsaCodes: region.fsaCodes || region.fsa_codes || [],
            // 保留原始的fsa_codes以保持兼容性
            fsa_codes: region.fsa_codes || region.fsaCodes || []
          }))
        }));

        setCities(normalizedCities);

        // 收集所有配置的FSA
        const configuredFSAs = [];
        normalizedCities.forEach(city => {
          if (city.regions && Array.isArray(city.regions)) {
            city.regions.forEach(region => {
              const fsaCodes = region.fsaCodes || [];
              if (fsaCodes && fsaCodes.length > 0) {
                configuredFSAs.push(...fsaCodes);
              }
            });
          }
        });
        // 去重
        const uniqueFSAs = [...new Set(configuredFSAs)];
        setAllConfiguredFSAs(uniqueFSAs);
        console.log('配置的FSA总数:', uniqueFSAs.length, '部分FSA:', uniqueFSAs.slice(0, 10));

        // 移除了统计数据计算，因为不再需要StatsOverview
      } catch (err) {
        console.error('加载城市数据失败:', err);
        console.error('错误详情:', err.message, err.stack);
        setError('无法加载城市数据，请检查后端服务是否运行');

        // 尝试从localStorage加载备用数据
        const fallbackData = localStorage.getItem('truck_delivery_cities');
        if (fallbackData) {
          try {
            const parsedCities = JSON.parse(fallbackData);
            setCities(parsedCities);
            console.log('已从本地缓存加载备用数据');
          } catch (parseErr) {
            console.error('解析本地数据失败:', parseErr);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 处理城市选择
  const handleCitySelect = async (city, skipHighlight = false, specificFSA = null) => {
    console.log('选择城市:', city, '跳过高亮:', skipHighlight, '特定FSA:', specificFSA);
    setSelectedCity(city);
    setSelectedRegion(null); // 重置选中的区域
    setSelectedGroup(null); // 重置选中的分组
    setRegionFSAGroups([]); // 重置FSA分组

    try {
      let regions = [];
      // 从后端API加载该城市的区域数据
      if (city.regions && city.regions.length > 0) {
        // 如果城市对象已经包含区域数据，直接使用（已经在loadData中规范化过）
        regions = city.regions;
        setCityRegions(regions);

        // 如果有特定的FSA，只高亮该FSA并自动点击
        if (specificFSA) {
          console.log('高亮特实FSA:', specificFSA);
          setHighlightedFSAs([specificFSA]);
          // 自动触发FSA点击事件
          setTimeout(() => {
            handleFSAClick(specificFSA);
          }, 500);
        }
        // 只有当不跳过高亮时，才收集所有FSA用于高亮显示
        else if (!skipHighlight) {
          const allFSAs = [];
          regions.forEach(region => {
            // 使用已规范化的fsaCodes字段
            const fsaCodes = region.fsaCodes || [];
            if (fsaCodes.length > 0) {
              allFSAs.push(...fsaCodes);
            }
          });
          console.log('高亮的FSA列表:', allFSAs);
          setHighlightedFSAs(allFSAs);
        }
      } else {
        // 如果没有区域数据，尝试从 API 获取
        const zones = await zoneApi.getByCityId(city.id);

        // 规范化zone数据（snake_case 转 camelCase）并加载FSA分组
        regions = await Promise.all(zones.map(async (zone) => {
          // 尝试从FSA分组中获取实际的FSA列表
          let calculatedFSAs = [];

          // 优先使用后端计算的数据
          if (zone.calculated_fsa_codes && zone.calculated_fsa_codes.length > 0) {
            calculatedFSAs = zone.calculated_fsa_codes;
            console.log(`区域 ${zone.name} 使用后端计算的 ${calculatedFSAs.length} 个FSA`);
          } else {
            // 如果后端没有计算数据，尝试从分组加载
            try {
              const groups = await getRegionFSAGroups(zone.id);
              if (groups && groups.length > 0) {
                const allFSAs = new Set();
                groups.forEach(group => {
                  const fsaCodes = group.fsaCodes || [];
                  fsaCodes.forEach(fsa => allFSAs.add(fsa));
                });
                calculatedFSAs = Array.from(allFSAs).sort();
                console.log(`区域 ${zone.name} 从分组加载了 ${calculatedFSAs.length} 个FSA`);
              }
            } catch (err) {
              console.error(`加载区域 ${zone.name} 的FSA分组失败:`, err);
            }
          }

          // 如果从分组计算出了FSA，使用计算结果；否则使用原始数据
          const finalFSAs = calculatedFSAs.length > 0
            ? calculatedFSAs
            : (zone.fsaCodes || zone.fsa_codes || []);

          return {
            ...zone,
            fsaCodes: finalFSAs,
            fsa_codes: finalFSAs
          };
        }));

        setCityRegions(regions);

        // 如果有特定的FSA，只高亮该FSA并自动点击
        if (specificFSA) {
          console.log('高亮特实FSA:', specificFSA);
          setHighlightedFSAs([specificFSA]);
          // 自动触发FSA点击事件
          setTimeout(() => {
            handleFSAClick(specificFSA);
          }, 500);
        }
        // 只有当不跳过高亮时，才收集所有FSA用于高亮显示
        else if (!skipHighlight) {
          const allFSAs = [];
          regions.forEach(region => {
            const fsaCodes = region.fsaCodes || [];
            if (fsaCodes.length > 0) {
              allFSAs.push(...fsaCodes);
            }
          });
          console.log('高亮的FSA列表:', allFSAs);
          setHighlightedFSAs(allFSAs);
        }
      }

      // 如果没有特定的FSA，且有区域，自动选择第一个区域并加载其FSA分组
      if (!specificFSA && regions && regions.length > 0) {
        // 对于每个区域，尝试加载其FSA分组并更新fsaCodes
        for (const region of regions) {
          // 优先使用后端计算的数据
          if (region.calculated_fsa_codes && region.calculated_fsa_codes.length > 0) {
            region.fsaCodes = region.calculated_fsa_codes;
            region.fsa_codes = region.calculated_fsa_codes;
            console.log(`区域 ${region.name} 使用后端计算的 ${region.calculated_fsa_codes.length} 个FSA`);
          } else {
            // 如果后端没有计算数据，尝试从FSA分组加载
            try {
              const groups = await getRegionFSAGroups(region.id);
              if (groups && groups.length > 0) {
                const fsaSet = new Set();
                groups.forEach(group => {
                  const groupFSAs = group.fsaCodes || [];
                  groupFSAs.forEach(fsa => fsaSet.add(fsa));
                });
                const allFSAs = Array.from(fsaSet).sort();
                if (allFSAs.length > 0) {
                  region.fsaCodes = allFSAs;
                  region.fsa_codes = allFSAs;
                  console.log(`区域 ${region.name} 从分组加载了 ${allFSAs.length} 个FSA`);
                }
              }
            } catch (err) {
              console.error(`加载区域 ${region.name} 的FSA分组失败:`, err);
              // 如果FSA数据为空，尝试重新加载
              if (!region.fsaCodes || region.fsaCodes.length === 0) {
                try {
                  const zoneDetail = await zoneApi.getById(region.id);
                  if (zoneDetail) {
                    region.fsaCodes = zoneDetail.calculated_fsa_codes || zoneDetail.fsa_codes || [];
                    region.fsa_codes = region.fsaCodes;
                    console.log(`区域 ${region.name} 重试加载成功: ${region.fsaCodes.length} 个FSA`);
                  }
                } catch (retryErr) {
                  console.error(`区域 ${region.name} 重试加载失败:`, retryErr);
                }
              }
            }
          }
        }

        // 选择第一个区域
        const firstRegion = regions[0];
        await handleRegionClick(firstRegion);
      }
    } catch (err) {
      console.error('加载城市区域数据失败:', err);
      console.error('错误详情:', err.message);
      setCityRegions([]);
      setHighlightedFSAs([]);
      setRegionFSAGroups([]);
    }
  };

  // 清除选择
  const handleClearSelection = () => {
    setSelectedCity(null);
    setCityRegions([]);
    setHighlightedFSAs([]);
  };

  // 处理搜索
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  // 处理搜索结果选择
  const handleSearchSelect = (suggestion) => {
    console.log('搜索选择:', suggestion);

    if (suggestion.type === 'city') {
      handleCitySelect(suggestion.data);
    } else if (suggestion.type === 'fsa') {
      // 高亮显示FSA
      setHighlightedFSAs([suggestion.value]);
      // 如果FSA属于某个城市，也选中该城市
      if (suggestion.data.cityInfo) {
        handleCitySelect(suggestion.data.cityInfo);
      }
    } else if (suggestion.type === 'postal') {
      // 处理邮编搜索
      setHighlightedFSAs([suggestion.data.fsa]);
      if (suggestion.data.cityInfo) {
        handleCitySelect(suggestion.data.cityInfo);
      }
    }
  };

  // 处理城市导航
  const handleCityNavigation = (cityData) => {
    navigate(`/truck-delivery/city/${cityData.id}`);
  };

  // 处理区域点击
  const handleRegionClick = async (region) => {
    // 重置分组选择
    setSelectedGroup(null);

    // 加载该区域的FSA分组
    try {
      const groups = await getRegionFSAGroups(region.id);
      setRegionFSAGroups(groups || []);
      console.log('区域FSA分组:', groups);

      // 从分组中收集所有FSA
      let allFSAs = [];
      if (groups && groups.length > 0) {
        const fsaSet = new Set();
        groups.forEach(group => {
          const groupFSAs = group.fsaCodes || [];
          groupFSAs.forEach(fsa => fsaSet.add(fsa));
        });
        allFSAs = Array.from(fsaSet).sort();
        console.log('从分组收集的FSA:', allFSAs.length, '个');
      }

      // 如果从分组中获取到FSA，更新region的fsaCodes
      if (allFSAs.length > 0) {
        region.fsaCodes = allFSAs;
        region.fsa_codes = allFSAs;
      }

      // 高亮显示区域的所有FSA
      const fsaCodes = allFSAs.length > 0 ? allFSAs : (region.fsaCodes || []);
      setHighlightedFSAs(fsaCodes);

    } catch (err) {
      console.error('加载FSA分组失败:', err);
      setRegionFSAGroups([]);
      // 使用原有的FSA数据
      const fsaCodes = region.fsaCodes || [];
      setHighlightedFSAs(fsaCodes);
    }

    setSelectedRegion(region); // 设置选中的区域
    console.log('区域点击，高亮FSA:', region.fsaCodes || []);
  };

  // 处理区域标签选择
  const handleRegionTabSelect = (region) => {
    setSelectedRegion(region);
    handleRegionClick(region);
  };

  // 处理分组点击 - 只显示该分组的FSA
  const handleGroupClick = (group, region) => {
    if (selectedGroup?.id === group.id) {
      // 如果点击已选中的分组，取消选择并显示整个区域的FSA
      setSelectedGroup(null);
      // 恢复显示区域的所有FSA
      const allFSAs = region.fsaCodes || region.fsa_codes || [];
      setHighlightedFSAs(allFSAs);
      console.log('取消分组选择，显示所有FSA:', allFSAs.length);
    } else {
      // 选择新分组，只显示该分组的FSA
      setSelectedGroup(group);
      const groupFSAs = group.fsas || [];
      setHighlightedFSAs(groupFSAs);
      console.log('选择分组:', group.name, '显示FSA:', groupFSAs.length);
    }
  };

  // 处理FSA点击
  const handleFSAClick = (fsa, regionId = null) => {
    // 高亮显示单个FSA
    setHighlightedFSAs([fsa]);
    console.log('FSA点击，高亮FSA:', fsa, '区域ID:', regionId);

    // 更新价格查询面板的FSA
    // 使用传入的regionId，如果没有则使用当前选中的区域
    let actualRegionId = regionId || selectedRegion?.id;
    let actualCityId = selectedCity?.id;
    let needCitySwitch = false;
    let targetCity = null;
    let targetRegion = null;

    // 如果没有regionId，尝试在当前城市的所有区域中查找
    if (!actualRegionId && cityRegions.length > 0) {
      for (const region of cityRegions) {
        const fsaCodes = region.fsaCodes || [];
        if (fsaCodes.includes(fsa)) {
          actualRegionId = region.id;
          targetRegion = region;
          console.log('自动找到并选择区域:', region.name, region.id);
          break;
        }
      }
    }

    // 如果还是没找到，在所有城市中查找
    if (!actualRegionId && cities.length > 0) {
      for (const city of cities) {
        if (city.regions && Array.isArray(city.regions)) {
          for (const region of city.regions) {
            const fsaCodes = region.fsaCodes || [];
            if (fsaCodes.includes(fsa)) {
              actualRegionId = region.id;
              actualCityId = city.id;
              targetRegion = region;
              // 如果找到的是其他城市的FSA，标记需要切换城市
              if (city.id !== selectedCity?.id) {
                console.log('FSA属于其他城市，需要切换到:', city.name);
                needCitySwitch = true;
                targetCity = city;
              }
              break;
            }
          }
          if (actualRegionId) break;
        }
      }
    }

    // 如果需要切换城市，使用特殊处理避免高亮整个城市
    if (needCitySwitch && targetCity) {
      // 设置城市但不触发高亮所有FSA
      setSelectedCity(targetCity);
      // 只加载区域数据，不高亮
      if (targetCity.regions && targetCity.regions.length > 0) {
        setCityRegions(targetCity.regions);
      }
      // 保持只高亮点击的FSA
      setHighlightedFSAs([fsa]);
    }

    // 设置选中的区域
    if (targetRegion) {
      setSelectedRegion(targetRegion);
    }

    // 如果找到了regionId或者有默认区域，显示价格面板
    if (actualRegionId || cityRegions.length > 0) {
      // 如果还是没有regionId，使用第一个区域作为默认
      if (!actualRegionId && cityRegions.length > 0) {
        actualRegionId = cityRegions[0].id;
        setSelectedRegion(cityRegions[0]);
        console.log('使用默认区域:', cityRegions[0].name);
      }

      // 确保有cityId
      if (!actualCityId) {
        actualCityId = selectedCity?.id || 'toronto';
      }

      setSelectedFSAForPricing({
        fsaCode: fsa,
        regionId: actualRegionId,
        cityId: actualCityId
      });
      setPricingPanelOpen(true);
      setIsPanelCollapsed(false); // 确保面板展开
      console.log('显示价格查询面板 - FSA:', fsa, '区域ID:', actualRegionId, '城市ID:', actualCityId);
    } else {
      console.warn('无法显示价格查询面板：找不到区域信息');
    }
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      {/* 顶部导航栏 */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboards')}
              className="hover:bg-gray-700"
              title="返回仪表板中心"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">卡车配送仪表板</h1>
                <p className="text-xs text-gray-400">
                  实时监控城市配送网络
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {selectedCity && (
              <Badge
                variant="outline"
                className="px-4 py-2 border-gray-700 bg-gray-800/50"
              >
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: selectedCity.themeColor || selectedCity.theme_color || '#60A5FA' }}
                />
                <span className="text-sm text-white mr-2">{selectedCity.name}</span>
                <button
                  onClick={handleClearSelection}
                  className="text-gray-400 hover:text-white ml-1"
                >
                  ×
                </button>
              </Badge>
            )}
            <Badge variant="outline" className="border-gray-700 text-gray-300">
              <Activity className="w-3 h-3 mr-1 text-green-500" />
              实时数据
            </Badge>
            <Badge variant="outline" className="border-gray-700 text-gray-300">
              <Shield className="w-3 h-3 mr-1 text-blue-500" />
              已认证
            </Badge>
          </div>
        </div>
      </div>

      {/* 加载状态 */}
      {loading && (
        <LoadingState
          fullScreen
          message="正在加载城市数据..."
          submessage="请稍候，正在连接服务器"
        />
      )}

      {/* 错误提示 */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50"
        >
          <Card className="border-red-900/50 bg-red-900/90 text-white">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* 主要内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部区域标签导航 - 只在选中城市时显示 */}
        {selectedCity && cityRegions.length > 0 && (
          <RegionTabs
            regions={cityRegions}
            selectedRegion={selectedRegion}
            selectedGroup={selectedGroup}
            regionFSAGroups={regionFSAGroups}
            onRegionSelect={handleRegionTabSelect}
            onGroupClick={handleGroupClick}
            onFSAClick={handleFSAClick}
            highlightedFSAs={highlightedFSAs}
          />
        )}

        {/* 内容区：左侧城市列表 + 地图 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 左侧城市列表面板 */}
          <CityListPanel
            cities={cities}
            selectedCity={selectedCity}
            onCitySelect={handleCitySelect}
            isMobile={false}
          />

          {/* 地图区域 - 占据剩余所有空间 */}
          <div className="flex-1 relative bg-gray-900">
            <TruckDeliveryMap
              highlightedFSAs={highlightedFSAs}
              isGroupFiltered={!!selectedGroup} // 新增：标识是否在分组筛选模式
              cityView={selectedCity}
              cityRegions={cityRegions} // 传递城市区域数据，包含颜色信息
              allCities={cities} // 传递所有城市数据，用于全局视图颜色
              searchQuery={searchQuery}
              configuredFSAs={allConfiguredFSAs} // 传递所有配置的FSA
              onFSAClick={handleFSAClick} // 传递FSA点击事件处理函数
              className="h-full w-full"
            />

            {/* 地图图例 - 显示在右下角 */}
            {selectedCity && cityRegions.length > 0 ? (
              <RegionColorLegend
                regions={cityRegions}
                className="absolute bottom-4 right-4 max-w-xs"
              />
            ) : !selectedCity && cities.length > 0 && (
              // 全局视图时显示所有城市的区域
              <RegionColorLegend
                regions={(() => {
                  // 收集所有城市的所有区域
                  const allRegions = [];
                  const regionMap = new Map();

                  cities.forEach(city => {
                    if (city.regions) {
                      city.regions.forEach(region => {
                        const key = region.name || region.zone_name || region.id;
                        if (!regionMap.has(key)) {
                          regionMap.set(key, {
                            ...region,
                            name: `${city.name} - ${region.name || region.zone_name || `区域${region.id}`}`,
                            fsaCodes: region.fsaCodes || region.fsa_codes || []
                          });
                        }
                      });
                    }
                  });

                  return Array.from(regionMap.values()).slice(0, 8); // 最多显示8个区域
                })()}
                className="absolute bottom-4 right-4 max-w-xs"
              />
            )}
          </div>
        </div>
      </div>

      {/* FSA价格查询面板（左侧固定） */}
      <FSAPricingPanelV2
        isOpen={pricingPanelOpen}
        onClose={() => {
          setPricingPanelOpen(false);
          setSelectedFSAForPricing(null);
        }}
        fsaCode={selectedFSAForPricing?.fsaCode}
        regionId={selectedFSAForPricing?.regionId}
        cityId={selectedFSAForPricing?.cityId}
        isCollapsed={isPanelCollapsed}
        onToggleCollapse={() => setIsPanelCollapsed(!isPanelCollapsed)}
      />
    </div>
  );
};

// 包装错误边界
const TruckDeliveryDashboardWithErrorBoundary = () => {
  return (
    <DashboardErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Dashboard错误:', error, errorInfo);
      }}
      onReset={() => {
        window.location.reload();
      }}
    >
      <TruckDeliveryDashboard />
    </DashboardErrorBoundary>
  );
};

export default TruckDeliveryDashboardWithErrorBoundary;