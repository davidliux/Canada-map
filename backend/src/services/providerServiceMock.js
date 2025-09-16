// Mock Provider Service
// 模拟服务商数据服务

class ProviderServiceMock {
  constructor() {
    // 模拟数据
    this.providers = [
      {
        id: '1',
        code: 'PDN',
        name: 'PDN Express',
        type: 'EXPRESS',
        status: 'ACTIVE',
        description: '专业快递服务商，覆盖全国主要城市',
        contactInfo: {
          phone: '1-800-PDN-1234',
          email: 'contact@pdn.com'
        },
        capabilities: ['快递', '货运', '仓储'],
        businessRules: {
          maxWeight: 100,
          maxVolume: 5
        },
        priority: 1,
        isActive: true,
        serviceAreas: [
          {
            zoneId: 'zone1',
            zoneName: '一区',
            regions: ['Toronto', 'Vancouver'],
            fsaCodes: ['M5V', 'V6B'],
            cities: ['Toronto', 'Vancouver']
          }
        ],
        pricingModels: [
          {
            id: 'pm1',
            name: '标准定价',
            type: 'WEIGHT_ZONE',
            unit: 'KG',
            configuration: {
              basePrice: 10,
              pricePerKg: 2
            },
            zones: ['zone1'],
            isActive: true
          }
        ],
        surcharges: [
          {
            code: 'FUEL',
            name: '燃油附加费',
            type: 'FUEL',
            calculation: 'PERCENTAGE',
            value: 15,
            conditions: [],
            isActive: true
          }
        ]
      },
      {
        id: '2',
        code: 'FGX',
        name: 'FGX Logistics',
        type: 'FREIGHT',
        status: 'ACTIVE',
        description: '专业货运物流服务',
        contactInfo: {
          phone: '1-888-FGX-5678',
          email: 'info@fgx.com'
        },
        capabilities: ['货运', 'LTL', 'FTL'],
        businessRules: {
          minWeight: 50,
          maxWeight: 5000
        },
        priority: 2,
        isActive: true,
        serviceAreas: [
          {
            zoneId: 'zone2',
            zoneName: '二区',
            regions: ['Montreal', 'Calgary'],
            fsaCodes: ['H3B', 'T2P'],
            cities: ['Montreal', 'Calgary']
          }
        ],
        pricingModels: [
          {
            id: 'pm2',
            name: '货运定价',
            type: 'TIERED',
            unit: 'PALLET',
            configuration: {
              tiers: [
                { min: 1, max: 5, price: 100 },
                { min: 6, max: 10, price: 90 },
                { min: 11, max: 999, price: 80 }
              ]
            },
            zones: ['zone2'],
            isActive: true
          }
        ],
        surcharges: [
          {
            code: 'LIFTGATE',
            name: '尾板服务',
            type: 'LIFTGATE',
            calculation: 'FIXED',
            value: 50,
            conditions: [],
            isActive: true
          }
        ]
      }
    ];
  }

  async getProviders(filters = {}) {
    let result = [...this.providers];
    
    if (filters.status) {
      result = result.filter(p => p.status === filters.status);
    }
    
    if (filters.type) {
      result = result.filter(p => p.type === filters.type);
    }
    
    if (filters.isActive !== undefined) {
      result = result.filter(p => p.isActive === filters.isActive);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.code.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
      );
    }
    
    return result;
  }

  async getProviderById(id) {
    const provider = this.providers.find(p => p.id === id);
    if (!provider) {
      throw new Error('Provider not found');
    }
    return provider;
  }

  async getProviderStats(id) {
    return {
      totalOrders: Math.floor(Math.random() * 1000),
      monthlyOrders: Math.floor(Math.random() * 100),
      averageDeliveryTime: Math.floor(Math.random() * 48) + 24,
      successRate: Math.floor(Math.random() * 10) + 90,
      totalRevenue: Math.floor(Math.random() * 100000),
      activeRoutes: Math.floor(Math.random() * 50)
    };
  }

  async getAvailableProviders(address) {
    // 返回所有激活的服务商
    return this.providers.filter(p => p.isActive);
  }

  async createProvider(providerData, userId) {
    // 检查代码是否已存在
    const existing = this.providers.find(p => p.code === providerData.code);
    if (existing) {
      throw new Error('Provider code already exists');
    }
    
    const newProvider = {
      ...providerData,
      id: String(this.providers.length + 1),
      status: 'PENDING',
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.providers.push(newProvider);
    return newProvider;
  }

  async updateProvider(id, updateData, userId) {
    const index = this.providers.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Provider not found');
    }
    
    this.providers[index] = {
      ...this.providers[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    return this.providers[index];
  }

  async deleteProvider(id, userId) {
    const index = this.providers.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Provider not found');
    }
    
    // 检查是否有关联数据
    // 这里简化处理，实际应该检查数据库
    
    this.providers.splice(index, 1);
    return true;
  }

  async activateProvider(id, userId) {
    const provider = await this.getProviderById(id);
    provider.isActive = true;
    provider.status = 'ACTIVE';
    provider.updatedAt = new Date().toISOString();
    return provider;
  }

  async deactivateProvider(id, userId) {
    const provider = await this.getProviderById(id);
    provider.isActive = false;
    provider.status = 'INACTIVE';
    provider.updatedAt = new Date().toISOString();
    return provider;
  }
}

module.exports = new ProviderServiceMock();