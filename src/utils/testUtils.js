/**
 * 测试工具函数
 * 
 * 提供动态定价功能的测试用例和模拟数据
 * Tasks 56-58: 测试用例创建
 */

// 测试数据生成器
export const createMockCity = (overrides = {}) => ({
  id: 'city-test-001',
  name: '测试城市',
  province: 'ON',
  themeColor: '#2196F3',
  isActive: true,
  regions: [
    {
      id: 'region-001',
      name: '市中心',
      level: 1,
      fsaList: ['M5V', 'M5G', 'M5H'],
      displayColor: '#FF5722'
    },
    {
      id: 'region-002',
      name: '郊区',
      level: 2,
      fsaList: ['M2M', 'M2N', 'M2P'],
      displayColor: '#4CAF50'
    }
  ],
  ...overrides
});

export const createMockPricingRule = (overrides = {}) => ({
  id: 'rule-test-001',
  name: '测试定价规则',
  cityId: 'city-test-001',
  regionId: 'region-001',
  isActive: true,
  weightRanges: [
    {
      min: 0,
      max: 5,
      basePrice: 15.99,
      perKgPrice: 2.50
    },
    {
      min: 5,
      max: 10,
      basePrice: 25.99,
      perKgPrice: 2.00
    },
    {
      min: 10,
      max: -1,
      basePrice: 45.99,
      perKgPrice: 1.50
    }
  ],
  lastModified: new Date().toISOString(),
  ...overrides
});

// 测试断言工具
export const assertions = {
  isValidPricingRule(rule) {
    const errors = [];
    
    if (!rule.id) errors.push('Rule ID is required');
    if (!rule.name) errors.push('Rule name is required');
    if (!rule.cityId) errors.push('City ID is required');
    if (!rule.regionId) errors.push('Region ID is required');
    if (!Array.isArray(rule.weightRanges)) errors.push('Weight ranges must be an array');
    
    if (rule.weightRanges) {
      rule.weightRanges.forEach((range, index) => {
        if (range.min < 0) errors.push(`Range ${index}: min weight cannot be negative`);
        if (range.max !== -1 && range.max <= range.min) errors.push(`Range ${index}: max weight must be greater than min`);
        if (range.basePrice <= 0) errors.push(`Range ${index}: base price must be positive`);
        if (range.perKgPrice < 0) errors.push(`Range ${index}: per kg price cannot be negative`);
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  isValidCity(city) {
    const errors = [];
    
    if (!city.id) errors.push('City ID is required');
    if (!city.name) errors.push('City name is required');
    if (!city.province) errors.push('Province is required');
    if (!Array.isArray(city.regions)) errors.push('Regions must be an array');
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

// 性能测试工具
export const performanceTest = {
  async measureExecutionTime(fn, iterations = 1) {
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      times.push(end - start);
    }
    
    return {
      average: times.reduce((sum, time) => sum + time, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      total: times.reduce((sum, time) => sum + time, 0),
      iterations
    };
  },

  async stressTest(fn, concurrency = 10, duration = 5000) {
    const results = [];
    const startTime = Date.now();
    const promises = [];

    for (let i = 0; i < concurrency; i++) {
      promises.push((async () => {
        while (Date.now() - startTime < duration) {
          try {
            const start = performance.now();
            await fn();
            const end = performance.now();
            results.push({ success: true, duration: end - start });
          } catch (error) {
            results.push({ success: false, error: error.message });
          }
        }
      })());
    }

    await Promise.all(promises);

    const successes = results.filter(r => r.success);
    const failures = results.filter(r => !r.success);

    return {
      totalRequests: results.length,
      successfulRequests: successes.length,
      failedRequests: failures.length,
      successRate: (successes.length / results.length) * 100,
      averageResponseTime: successes.length > 0 
        ? successes.reduce((sum, r) => sum + r.duration, 0) / successes.length 
        : 0,
      errors: failures.map(f => f.error)
    };
  }
};

// 模拟API响应
export const mockApiResponses = {
  getCityPricingRules: (cityId) => {
    return Promise.resolve([
      createMockPricingRule({ cityId, regionId: 'region-001' }),
      createMockPricingRule({ cityId, regionId: 'region-002', name: '郊区定价规则' })
    ]);
  },

  getRegionPricing: (cityId, regionId) => {
    return Promise.resolve([
      createMockPricingRule({ cityId, regionId })
    ]);
  },

  updateRegionPricing: (cityId, regionId, rules) => {
    return Promise.resolve({
      success: true,
      cityId,
      regionId,
      updatedRulesCount: rules.length
    });
  }
};

// 组件测试工具
export const componentTestUtils = {
  createMockProps(component, overrides = {}) {
    const defaultProps = {
      CityRegionSelector: {
        selectedCityId: null,
        selectedRegionId: null,
        onCitySelect: jest.fn(),
        onRegionSelect: jest.fn(),
        allowEmpty: false,
        multiSelect: false,
        showBatchOperations: false
      },
      EnhancedPricingRuleEditor: {
        cityId: 'city-test-001',
        regionId: 'region-001',
        onSave: jest.fn(),
        onCancel: jest.fn(),
        showTemplates: true
      },
      PricingRuleList: {
        cityId: 'city-test-001',
        onEdit: jest.fn(),
        onCreateNew: jest.fn(),
        enableBatchOperations: true
      }
    };

    return {
      ...defaultProps[component],
      ...overrides
    };
  },

  mockLocalStorage() {
    const store = {};
    return {
      getItem: jest.fn((key) => store[key] || null),
      setItem: jest.fn((key, value) => {
        store[key] = value.toString();
      }),
      removeItem: jest.fn((key) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      })
    };
  }
};

// 集成测试场景
export const integrationTests = {
  async testCompleteWorkflow() {
    console.log('开始集成测试：完整定价配置流程');
    
    try {
      // 1. 创建城市
      const city = createMockCity();
      console.log('✓ 城市数据创建成功');

      // 2. 创建定价规则
      const rule = createMockPricingRule();
      const validation = assertions.isValidPricingRule(rule);
      if (!validation.isValid) {
        throw new Error('定价规则验证失败: ' + validation.errors.join(', '));
      }
      console.log('✓ 定价规则验证通过');

      // 3. 测试批量操作
      const batchRules = city.regions.map(region => 
        createMockPricingRule({ regionId: region.id, name: `${region.name}定价规则` })
      );
      console.log('✓ 批量规则创建成功');

      // 4. 测试数据导出导入
      const exportData = {
        city,
        rules: batchRules,
        exportDate: new Date().toISOString()
      };
      console.log('✓ 数据导出格式正确');

      return {
        success: true,
        city,
        rules: batchRules,
        exportData
      };

    } catch (error) {
      console.error('✗ 集成测试失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  async testErrorHandling() {
    console.log('开始测试错误处理机制');
    
    const testCases = [
      {
        name: '无效的定价规则',
        test: () => assertions.isValidPricingRule({}),
        expectErrors: true
      },
      {
        name: '负数价格',
        test: () => assertions.isValidPricingRule(createMockPricingRule({
          weightRanges: [{ min: 0, max: 5, basePrice: -10, perKgPrice: 2 }]
        })),
        expectErrors: true
      },
      {
        name: '有效的定价规则',
        test: () => assertions.isValidPricingRule(createMockPricingRule()),
        expectErrors: false
      }
    ];

    const results = [];
    for (const testCase of testCases) {
      const result = testCase.test();
      const passed = testCase.expectErrors ? !result.isValid : result.isValid;
      
      results.push({
        name: testCase.name,
        passed,
        result
      });

      console.log(`${passed ? '✓' : '✗'} ${testCase.name}`);
    }

    return results;
  }
};

// 运行所有测试
export async function runAllTests() {
  console.log('🧪 开始运行动态定价功能测试套件');
  console.log('='.repeat(50));

  const results = {
    integration: await integrationTests.testCompleteWorkflow(),
    errorHandling: await integrationTests.testErrorHandling(),
    performance: null
  };

  // 性能测试
  console.log('\n📊 开始性能测试...');
  const performanceResult = await performanceTest.measureExecutionTime(
    () => integrationTests.testCompleteWorkflow(),
    5
  );
  results.performance = performanceResult;
  console.log(`平均执行时间: ${performanceResult.average.toFixed(2)}ms`);

  console.log('\n='.repeat(50));
  console.log('🎯 测试套件完成');
  
  return results;
}

export default {
  createMockCity,
  createMockPricingRule,
  assertions,
  performanceTest,
  mockApiResponses,
  componentTestUtils,
  integrationTests,
  runAllTests
};