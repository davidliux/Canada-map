import React, { useState, useEffect } from 'react';
import {
  createFSAGroup,
  updateFSAGroup,
  deleteFSAGroup,
  getRegionFSAGroups,
  getFSAGroup,
  getAllRegionConfigs,
  getRegionConfig
} from '../utils/unifiedStorage';
import {
  validateGroupName,
  detectFSAConflicts,
  getUngroupedFSAs
} from '../utils/fsaGroupValidation';
import groupAwarePricingService from '../services/groupAwarePricingService';
import { dataUpdateNotifier } from '../utils/dataUpdateNotifier';

const TestFSAGroups = () => {
  const [regions, setRegions] = useState({});
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [groups, setGroups] = useState([]);
  const [ungroupedFSAs, setUngroupedFSAs] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedFSAs, setSelectedFSAs] = useState([]);
  const [priceTestResult, setPriceTestResult] = useState(null);

  // 加载区域数据
  useEffect(() => {
    loadRegions();

    // 订阅数据更新
    const unsubscribe = dataUpdateNotifier.subscribe((updateInfo) => {
      console.log('收到数据更新通知:', updateInfo);
      if (updateInfo.type === 'fsaGroupUpdate' && selectedRegion) {
        loadGroups(selectedRegion);
      }
    });

    return () => unsubscribe();
  }, []);

  // 当选择区域改变时加载组数据
  useEffect(() => {
    if (selectedRegion) {
      loadGroups(selectedRegion);
    }
  }, [selectedRegion]);

  const loadRegions = async () => {
    try {
      const regionData = await getAllRegionConfigs();
      setRegions(regionData);
      addTestResult('✅ 成功加载区域数据', 'success');
    } catch (error) {
      addTestResult(`❌ 加载区域失败: ${error.message}`, 'error');
    }
  };

  const loadGroups = async (regionId) => {
    try {
      const regionConfig = await getRegionConfig(regionId);
      const fsaGroups = await getRegionFSAGroups(regionId);
      setGroups(fsaGroups);

      // 计算未分组的FSA
      const ungrouped = getUngroupedFSAs(regionConfig.fsaCodes || [], fsaGroups);
      setUngroupedFSAs(ungrouped);

      addTestResult(`✅ 加载区域 ${regionId} 的组: ${fsaGroups.length} 个组`, 'success');
    } catch (error) {
      addTestResult(`❌ 加载组失败: ${error.message}`, 'error');
    }
  };

  const addTestResult = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, { message, type, timestamp }]);
  };

  // 测试创建组
  const testCreateGroup = async () => {
    if (!selectedRegion || !newGroupName) {
      addTestResult('❌ 请选择区域并输入组名', 'error');
      return;
    }

    try {
      // 验证组名
      const validation = validateGroupName(newGroupName, groups);
      if (!validation.isValid) {
        addTestResult(`❌ 组名验证失败: ${validation.errors.join(', ')}`, 'error');
        return;
      }

      // 创建组
      const newGroup = await createFSAGroup(selectedRegion, {
        name: newGroupName,
        fsaCodes: selectedFSAs
      });

      if (newGroup) {
        addTestResult(`✅ 成功创建组: ${newGroup.name} (ID: ${newGroup.id})`, 'success');
        await loadGroups(selectedRegion);
        setNewGroupName('');
        setSelectedFSAs([]);
      } else {
        addTestResult('❌ 创建组失败', 'error');
      }
    } catch (error) {
      addTestResult(`❌ 创建组异常: ${error.message}`, 'error');
    }
  };

  // 测试删除组
  const testDeleteGroup = async (groupId) => {
    try {
      const success = await deleteFSAGroup(selectedRegion, groupId);
      if (success) {
        addTestResult(`✅ 成功删除组 ${groupId}`, 'success');
        await loadGroups(selectedRegion);
      } else {
        addTestResult(`❌ 删除组 ${groupId} 失败`, 'error');
      }
    } catch (error) {
      addTestResult(`❌ 删除组异常: ${error.message}`, 'error');
    }
  };

  // 测试价格计算
  const testPriceCalculation = async () => {
    if (!selectedRegion || ungroupedFSAs.length === 0) {
      addTestResult('❌ 请选择有FSA的区域', 'error');
      return;
    }

    try {
      const testFSA = ungroupedFSAs[0];
      const testWeight = 25; // 25kg

      // 获取价格层级
      const hierarchy = await groupAwarePricingService.getPricingHierarchy(
        selectedRegion,
        testFSA
      );

      // 计算价格
      const priceResult = await groupAwarePricingService.calculatePriceWithGroups(
        selectedRegion,
        testFSA,
        testWeight
      );

      setPriceTestResult({
        fsa: testFSA,
        weight: testWeight,
        hierarchy,
        priceResult
      });

      addTestResult(`✅ 价格计算成功: FSA=${testFSA}, 价格=${priceResult.price}`, 'success');
    } catch (error) {
      addTestResult(`❌ 价格计算失败: ${error.message}`, 'error');
    }
  };

  // 测试冲突检测
  const testConflictDetection = () => {
    if (groups.length === 0) {
      addTestResult('❌ 没有组可用于测试冲突检测', 'error');
      return;
    }

    const testFSAs = groups[0].fsaCodes || [];
    const conflicts = detectFSAConflicts(testFSAs, groups, 'test-group-id');

    if (conflicts.hasConflicts) {
      addTestResult(`✅ 冲突检测工作正常: 发现 ${conflicts.conflicts.length} 个冲突`, 'info');
    } else {
      addTestResult('✅ 冲突检测工作正常: 没有冲突', 'success');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">FSA组功能测试</h1>

      {/* 区域选择 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">选择区域</h2>
        <div className="grid grid-cols-4 gap-2">
          {Object.values(regions).map(region => (
            <button
              key={region.id}
              onClick={() => setSelectedRegion(region.id)}
              className={`p-2 rounded ${
                selectedRegion === region.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {region.name} ({region.fsaCodes?.length || 0} FSAs)
            </button>
          ))}
        </div>
      </div>

      {/* 组管理 */}
      {selectedRegion && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4">FSA组管理</h2>

          {/* 创建新组 */}
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <h3 className="font-medium mb-2">创建新组</h3>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="组名称"
                className="flex-1 px-3 py-2 border rounded"
              />
              <button
                onClick={testCreateGroup}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                创建组
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {ungroupedFSAs.map(fsa => (
                <label key={fsa} className="flex items-center gap-1 px-2 py-1 bg-white rounded border">
                  <input
                    type="checkbox"
                    checked={selectedFSAs.includes(fsa)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedFSAs([...selectedFSAs, fsa]);
                      } else {
                        setSelectedFSAs(selectedFSAs.filter(f => f !== fsa));
                      }
                    }}
                  />
                  <span className="text-sm">{fsa}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 现有组列表 */}
          <div className="space-y-2">
            <h3 className="font-medium">现有组 ({groups.length})</h3>
            {groups.map(group => (
              <div key={group.id} className="p-3 border rounded flex justify-between items-center">
                <div>
                  <span className="font-medium">{group.name}</span>
                  <span className="ml-2 text-sm text-gray-500">
                    ({group.fsaCodes?.length || 0} FSAs)
                  </span>
                  {group.customPricing?.enabled && (
                    <span className="ml-2 text-sm text-green-600">有自定义价格</span>
                  )}
                </div>
                <button
                  onClick={() => testDeleteGroup(group.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 测试操作 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">测试操作</h2>
        <div className="flex gap-2">
          <button
            onClick={testPriceCalculation}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            测试价格计算
          </button>
          <button
            onClick={testConflictDetection}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            测试冲突检测
          </button>
          <button
            onClick={() => groupAwarePricingService.clearPricingCache()}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            清除价格缓存
          </button>
        </div>
      </div>

      {/* 价格测试结果 */}
      {priceTestResult && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4">价格计算结果</h2>
          <div className="space-y-2">
            <p><strong>FSA:</strong> {priceTestResult.fsa}</p>
            <p><strong>重量:</strong> {priceTestResult.weight}kg</p>
            <p><strong>价格:</strong> ${priceTestResult.priceResult.price}</p>
            <p><strong>价格来源:</strong> {priceTestResult.priceResult.source}</p>
            <p><strong>价格层级:</strong></p>
            <ul className="ml-4">
              {priceTestResult.hierarchy.levels.map((level, idx) => (
                <li key={idx} className={level.isActive ? 'font-bold text-green-600' : ''}>
                  {level.type}: {level.name} {level.isActive && '(使用中)'}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 测试结果日志 */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold mb-4">测试日志</h2>
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {testResults.map((result, idx) => (
            <div
              key={idx}
              className={`p-2 rounded text-sm ${
                result.type === 'error' ? 'bg-red-50 text-red-700' :
                result.type === 'success' ? 'bg-green-50 text-green-700' :
                'bg-gray-50 text-gray-700'
              }`}
            >
              <span className="text-xs text-gray-500 mr-2">{result.timestamp}</span>
              {result.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestFSAGroups;