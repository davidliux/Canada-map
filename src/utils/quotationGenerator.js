/**
 * 报价单生成工具
 * 为FSA分区生成详细的配送价格报价单
 */

import { getAllRegionConfigs } from './unifiedStorage.js';
import { getRegionByFSA, getRegionDisplayInfo } from '../data/regionManagement.js';

/**
 * 生成FSA报价单HTML
 * @param {string} fsaCode - FSA代码
 * @param {string} province - 省份
 * @param {string} region - 地区
 * @returns {Promise<string>} 报价单HTML字符串
 */
export const generateQuotationHTML = async (fsaCode, province, region) => {
  try {
    // 使用简化架构：直接查找FSA属于哪个区域
    const assignedRegionId = await getRegionByFSA(fsaCode);

    if (!assignedRegionId) {
      return generateUnavailableQuotationHTML(fsaCode, province, region);
    }

    // 获取区域配置（用于价格信息）
    const regionConfigs = await getAllRegionConfigs();
    const regionConfig = regionConfigs[assignedRegionId];
    const regionInfo = getRegionDisplayInfo(assignedRegionId);

    // 如果区域配置不存在或未激活，仍然显示为可配送（因为有邮编数据）
    // 但可能没有价格信息
    if (!regionConfig || !regionConfig.isActive) {
      return generateBasicAvailableQuotationHTML(fsaCode, province, region, regionInfo, assignedRegionId);
    }

    return generateAvailableQuotationHTML(fsaCode, province, region, regionInfo, regionConfig);
  } catch (error) {
    console.error('生成报价单失败:', error);
    return generateErrorQuotationHTML(fsaCode, province, region);
  }
};

/**
 * 生成基础可配送区域的报价单HTML（无价格配置）
 */
const generateBasicAvailableQuotationHTML = (fsaCode, province, region, regionInfo, regionId) => {
  return `
    <div style="min-width: 280px; max-width: 320px; background: linear-gradient(135deg, #1f2937 0%, #374151 100%); border-radius: 12px; padding: 16px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3); border: 1px solid rgba(59, 130, 246, 0.3);">
      <!-- 标题区域 -->
      <div style="text-align: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid rgba(59, 130, 246, 0.2);">
        <div style="font-size: 20px; font-weight: 700; color: #ffffff; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">${fsaCode}</div>
        <div style="font-size: 14px; color: #d1d5db; margin-top: 4px;">${region}</div>
        <div style="font-size: 12px; color: #9ca3af;">${province}</div>
      </div>

      <!-- 配送状态 -->
      <div style="margin-bottom: 16px; padding: 12px; background: linear-gradient(135deg, #10b98120, #059669); border: 1px solid #10b981; border-radius: 8px; text-align: center;">
        <div style="font-size: 24px; margin-bottom: 6px;">✅</div>
        <h4 style="color: #10b981; margin: 0 0 6px 0; font-size: 16px; font-weight: 600;">可配送区域</h4>
        <p style="margin: 0; color: #6ee7b7; font-size: 13px;">配送区域: ${regionInfo.name}</p>
      </div>

      <!-- 价格配置提示 -->
      <div style="margin-bottom: 16px; padding: 12px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; text-align: center;">
        <div style="font-size: 16px; margin-bottom: 6px;">⚙️</div>
        <p style="margin: 0; color: #93c5fd; font-size: 13px;">价格配置待完善</p>
        <p style="margin: 4px 0 0 0; color: #d1d5db; font-size: 11px;">请联系客服获取具体价格</p>
      </div>

      <!-- 操作按钮 -->
      <div style="display: flex; gap: 8px; margin-top: 16px;">
        <button onclick="window.openFSAManagement && window.openFSAManagement('${fsaCode}', '${province}', '${region}')"
                style="flex: 1; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border: none; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
          配置价格
        </button>
        <button onclick="window.printQuotation && window.printQuotation('${fsaCode}')"
                style="flex: 1; background: linear-gradient(135deg, #10b981, #047857); color: white; border: none; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
          联系客服
        </button>
      </div>
    </div>
  `;
};

/**
 * 生成可配送区域的报价单HTML
 */
const generateAvailableQuotationHTML = (fsaCode, province, region, regionInfo, regionConfig) => {
  const activeRanges = regionConfig.weightRanges.filter(range => range.isActive);
  const lastUpdated = new Date(regionConfig.lastUpdated).toLocaleDateString();

  // 只显示前3个重量区间
  const topThreeRanges = activeRanges.slice(0, 3);

  // 生成简化的价格表行
  const priceRows = topThreeRanges.map(range => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: rgba(0, 0, 0, 0.2); border-radius: 6px; margin-bottom: 6px;">
      <span style="color: #e5e7eb; font-size: 13px;">${range.label}</span>
      <span style="color: #10b981; font-weight: 600; font-size: 14px;">$${range.price.toFixed(2)}</span>
    </div>
  `).join('');
  
  return `
    <div style="font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; min-width: 320px; max-width: 380px; background: linear-gradient(135deg, #1f2937 0%, #374151 100%); border-radius: 12px; padding: 18px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);">
      <!-- 标题区域 -->
      <div style="text-align: center; margin-bottom: 14px; border-bottom: 1px solid rgba(59, 130, 246, 0.2); padding-bottom: 10px;">
        <h3 style="color: #ffffff; margin: 0 0 4px 0; font-size: 20px; font-weight: 700; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">${fsaCode}</h3>
        <p style="margin: 0; color: #93c5fd; font-size: 13px; font-weight: 500;">${province} • ${region}</p>
      </div>

      <!-- 配送区域信息 -->
      <div style="margin-bottom: 14px; padding: 10px; background: linear-gradient(135deg, ${regionInfo.color}20, ${regionInfo.color}10); border: 1px solid ${regionInfo.color}40; border-radius: 8px;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 6px;">
          <div style="width: 10px; height: 10px; background: ${regionInfo.color}; border-radius: 50%; box-shadow: 0 0 6px ${regionInfo.color}60;"></div>
          <span style="color: #ffffff; font-weight: 600; font-size: 14px;">${regionInfo.name}</span>
        </div>
      </div>

      <!-- 简化的价格表 -->
      <div style="margin-bottom: 14px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
          <h4 style="color: #ffffff; margin: 0; font-size: 14px; font-weight: 600;">常用价格</h4>
          ${activeRanges.length > 3 ? `<span style="color: #6b7280; font-size: 11px;">+${activeRanges.length - 3} 更多</span>` : ''}
        </div>
        <div style="space-y: 6px;">
          ${priceRows}
        </div>
      </div>

      <!-- 自定义重量查询 -->
      <div style="margin-bottom: 14px; padding: 12px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px;">
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
          <span style="font-size: 14px;">🧮</span>
          <h4 style="color: #93c5fd; margin: 0; font-size: 13px; font-weight: 600;">自定义重量查询</h4>
        </div>

        <div style="display: flex; gap: 8px; align-items: center;">
          <input
            type="number"
            id="weight-input-${fsaCode}"
            placeholder="输入重量"
            min="0"
            step="0.1"
            style="flex: 1; padding: 6px 8px; background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 4px; color: #ffffff; font-size: 12px; outline: none;"
            onkeyup="calculateCustomPrice('${fsaCode}', this.value, ${JSON.stringify(activeRanges).replace(/"/g, '&quot;')})"
          />
          <span style="color: #9ca3af; font-size: 12px;">KG</span>
        </div>

        <div id="price-result-${fsaCode}" style="margin-top: 8px; min-height: 20px; font-size: 12px;"></div>
      </div>

      <!-- 操作按钮 -->
      <div style="display: flex; gap: 6px; margin-top: 14px;">
        <button onclick="window.openFSAManagement('${fsaCode}', '${province}', '${region}')" style="flex: 1; padding: 8px 12px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border: none; border-radius: 6px; color: white; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 12px;">
          🔧 管理
        </button>
        <button onclick="window.printQuotation('${fsaCode}')" style="flex: 1; padding: 8px 12px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border: none; border-radius: 6px; color: white; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 12px;">
          📄 报价单
        </button>
      </div>

      <!-- 底部信息 -->
      <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid rgba(59, 130, 246, 0.2); text-align: center;">
        <p style="margin: 0; color: #9ca3af; font-size: 10px;">最后更新: ${lastUpdated}</p>
        <p style="margin: 2px 0 0 0; color: #6b7280; font-size: 9px;">价格仅供参考，最终价格以实际报价为准</p>
      </div>

      <!-- 自定义价格计算脚本 -->
      <script>
        window.calculateCustomPrice = function(fsaCode, weight, ranges) {
          const resultDiv = document.getElementById('price-result-' + fsaCode);
          if (!weight || weight <= 0) {
            resultDiv.innerHTML = '';
            return;
          }

          const weightNum = parseFloat(weight);
          const matchingRange = ranges.find(range =>
            weightNum >= range.min && weightNum <= range.max
          );

          if (matchingRange) {
            resultDiv.innerHTML =
              '<div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 4px;">' +
              '<span style="color: #6ee7b7; font-size: 11px;">' + matchingRange.label + '</span>' +
              '<span style="color: #10b981; font-weight: 700; font-size: 13px;">$' + matchingRange.price.toFixed(2) + '</span>' +
              '</div>';
          } else {
            resultDiv.innerHTML =
              '<div style="padding: 6px 8px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 4px; text-align: center;">' +
              '<span style="color: #fbbf24; font-size: 11px;">⚠️ 超出配送重量范围</span>' +
              '</div>';
          }
        };
      </script>
    </div>
  `;
};

/**
 * 生成不可配送区域的报价单HTML
 */
const generateUnavailableQuotationHTML = (fsaCode, province, region) => {
  return `
    <div style="font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; min-width: 280px; background: linear-gradient(135deg, #1f2937 0%, #374151 100%); border-radius: 12px; padding: 20px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);">
      <!-- 标题区域 -->
      <div style="text-align: center; margin-bottom: 16px;">
        <h3 style="color: #ffffff; margin: 0 0 4px 0; font-size: 22px; font-weight: 700; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">${fsaCode}</h3>
        <p style="margin: 0; color: #93c5fd; font-size: 14px; font-weight: 500;">${province} • ${region}</p>
      </div>
      
      <!-- 不可配送提示 -->
      <div style="margin-bottom: 16px; padding: 16px; background: linear-gradient(135deg, #ef444420, #dc262610); border: 1px solid #ef444440; border-radius: 8px; text-align: center;">
        <div style="font-size: 32px; margin-bottom: 8px;">⚠️</div>
        <h4 style="color: #ef4444; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">暂不支持配送</h4>
        <p style="margin: 0; color: #fca5a5; font-size: 14px;">此区域尚未分配到任何配送区域</p>
      </div>
      
      <!-- 联系信息 */}
      <div style="padding: 12px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 8px; text-align: center;">
        <p style="margin: 0 0 8px 0; color: #93c5fd; font-size: 14px; font-weight: 500;">需要配送服务？</p>
        <p style="margin: 0; color: #d1d5db; font-size: 12px;">请联系客服了解更多信息</p>
      </div>
      
      <!-- 管理按钮 -->
      <button onclick="window.openFSAManagement('${fsaCode}', '${province}', '${region}')" style="width: 100%; margin-top: 16px; padding: 10px 16px; background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); border: none; border-radius: 8px; color: white; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 14px;">
        🔧 配置此区域
      </button>
    </div>
  `;
};

/**
 * 生成错误报价单HTML
 */
const generateErrorQuotationHTML = (fsaCode, province, region) => {
  return `
    <div style="font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; min-width: 280px; background: linear-gradient(135deg, #1f2937 0%, #374151 100%); border-radius: 12px; padding: 20px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);">
      <div style="text-align: center;">
        <h3 style="color: #ffffff; margin: 0 0 4px 0; font-size: 22px; font-weight: 700;">${fsaCode}</h3>
        <p style="margin: 0 0 16px 0; color: #93c5fd; font-size: 14px;">${province} • ${region}</p>
        
        <div style="padding: 16px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px;">
          <div style="font-size: 32px; margin-bottom: 8px;">❌</div>
          <p style="margin: 0; color: #ef4444; font-size: 14px;">加载报价信息失败</p>
        </div>
        
        <button onclick="window.location.reload()" style="width: 100%; margin-top: 16px; padding: 10px 16px; background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); border: none; border-radius: 8px; color: white; font-weight: 600; cursor: pointer; transition: all 0.2s;">
          🔄 重新加载
        </button>
      </div>
    </div>
  `;
};

/**
 * 生成可打印的报价单
 * @param {string} fsaCode - FSA代码
 * @returns {Promise<string>} 可打印的HTML内容
 */
export const generatePrintableQuotation = async (fsaCode) => {
  try {
    const regionConfigs = await getAllRegionConfigs();
    const assignedRegionId = await getRegionByFSA(fsaCode);
    
    if (!assignedRegionId) {
      return null;
    }
    
    const regionConfig = regionConfigs[assignedRegionId];
    const regionInfo = getRegionDisplayInfo(assignedRegionId);
    const activeRanges = regionConfig.weightRanges.filter(range => range.isActive);
    const lastUpdated = new Date(regionConfig.lastUpdated).toLocaleDateString();
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>配送报价单 - ${fsaCode}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .region-info { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; }
          th { background: #f9fafb; font-weight: bold; }
          .footer { text-align: center; font-size: 12px; color: #6b7280; margin-top: 30px; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>配送报价单</h1>
          <h2>${fsaCode}</h2>
          <p>配送区域：${regionInfo.name} (${regionInfo.description})</p>
        </div>
        
        <div class="region-info">
          <h3>区域信息</h3>
          <p><strong>FSA代码：</strong>${fsaCode}</p>
          <p><strong>配送区域：</strong>${regionInfo.name}</p>
          <p><strong>区域描述：</strong>${regionInfo.description}</p>
          <p><strong>最后更新：</strong>${lastUpdated}</p>
        </div>
        
        <h3>价格表</h3>
        <table>
          <thead>
            <tr>
              <th>重量区间</th>
              <th>价格 (CAD)</th>
            </tr>
          </thead>
          <tbody>
            ${activeRanges.map(range => `
              <tr>
                <td>${range.label}</td>
                <td>$${range.price.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>此报价单生成于 ${new Date().toLocaleString()}</p>
          <p>价格仅供参考，最终价格以实际报价为准</p>
        </div>
      </body>
      </html>
    `;
  } catch (error) {
    console.error('生成可打印报价单失败:', error);
    return null;
  }
};

/**
 * 打印报价单
 * @param {string} fsaCode - FSA代码
 */
export const printQuotation = async (fsaCode) => {
  const printableHTML = await generatePrintableQuotation(fsaCode);
  
  if (!printableHTML) {
    alert('无法生成报价单，请检查FSA配置');
    return;
  }
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(printableHTML);
  printWindow.document.close();
  printWindow.print();
};
