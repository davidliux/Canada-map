import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, 
  RefreshCw, 
  Database, 
  MapPin, 
  Globe,
  Settings as SettingsIcon,
  Monitor,
  Palette,
  Bell,
  Shield,
  Download,
  Upload,
  Trash2
} from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({
    // 地图设置
    map: {
      defaultZoom: 4,
      defaultCenter: { lat: 56.1304, lng: -106.3468 },
      maxZoom: 18,
      minZoom: 3,
      tileProvider: 'openstreetmap',
      showFSALabels: true,
      showProvinceLabels: true,
      animationDuration: 1000
    },
    // 数据设置
    data: {
      cacheDuration: 5 * 60 * 1000, // 5分钟
      autoRefresh: true,
      refreshInterval: 30000, // 30秒
      batchSize: 100,
      compressionEnabled: true
    },
    // 界面设置
    ui: {
      theme: 'dark',
      language: 'zh-CN',
      sidebarWidth: 320,
      showAnimations: true,
      compactMode: false,
      showTooltips: true
    },
    // 通知设置
    notifications: {
      enabled: true,
      dataUpdates: true,
      systemAlerts: true,
      performanceWarnings: true
    },
    // 安全设置
    security: {
      sessionTimeout: 30 * 60 * 1000, // 30分钟
      autoLogout: true,
      encryptLocalData: false,
      auditLog: true
    }
  });

  const [activeTab, setActiveTab] = useState('map');
  const [hasChanges, setHasChanges] = useState(false);

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // 保存设置到localStorage
    localStorage.setItem('app-settings', JSON.stringify(settings));
    setHasChanges(false);
    console.log('设置已保存:', settings);
  };

  const handleReset = () => {
    if (confirm('确定要重置所有设置到默认值吗？')) {
      localStorage.removeItem('app-settings');
      window.location.reload();
    }
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'canada-postal-settings.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importSettings = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target.result);
          setSettings(importedSettings);
          setHasChanges(true);
        } catch (error) {
          alert('导入设置文件失败：文件格式不正确');
        }
      };
      reader.readAsText(file);
    }
  };

  const tabs = [
    { id: 'map', label: '地图设置', icon: MapPin },
    { id: 'data', label: '数据设置', icon: Database },
    { id: 'ui', label: '界面设置', icon: Monitor },
    { id: 'notifications', label: '通知设置', icon: Bell },
    { id: 'security', label: '安全设置', icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* 标题栏 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-3 rounded-lg">
              <SettingsIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">系统设置</h1>
              <p className="text-gray-400 mt-1">配置加拿大邮政地图系统</p>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center space-x-3">
            <button
              onClick={exportSettings}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>导出</span>
            </button>

            <label className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>导入</span>
              <input
                type="file"
                accept=".json"
                onChange={importSettings}
                className="hidden"
              />
            </label>

            <button
              onClick={handleReset}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>重置</span>
            </button>

            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                hasChanges 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{hasChanges ? '保存设置' : '已保存'}</span>
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-12 gap-8">
        {/* 侧边栏标签 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="col-span-3"
        >
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">设置分类</h3>
            <div className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* 主要设置面板 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="col-span-9"
        >
          <div className="bg-gray-800 rounded-lg p-6">
            {activeTab === 'map' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
                  <MapPin className="w-6 h-6" />
                  <span>地图设置</span>
                </h3>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      默认缩放级别
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="18"
                      value={settings.map.defaultZoom}
                      onChange={(e) => updateSetting('map', 'defaultZoom', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>1</span>
                      <span>当前: {settings.map.defaultZoom}</span>
                      <span>18</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      动画持续时间 (ms)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="5000"
                      value={settings.map.animationDuration}
                      onChange={(e) => updateSetting('map', 'animationDuration', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">显示FSA标签</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.map.showFSALabels}
                        onChange={(e) => updateSetting('map', 'showFSALabels', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">显示省份标签</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.map.showProvinceLabels}
                        onChange={(e) => updateSetting('map', 'showProvinceLabels', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 其他标签页可以在这里添加 */}
            {activeTab !== 'map' && (
              <div className="text-center py-12">
                <Globe className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">
                  {tabs.find(t => t.id === activeTab)?.label}
                </h3>
                <p className="text-gray-500">此设置面板正在开发中...</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;