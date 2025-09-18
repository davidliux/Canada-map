/**
 * 颜色工具函数
 * 用于处理颜色的深浅变化
 */

/**
 * 将十六进制颜色转换为RGB
 * @param {string} hex - 十六进制颜色值
 * @returns {object} RGB对象
 */
export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

/**
 * 将RGB转换为十六进制颜色
 * @param {number} r - 红色值
 * @param {number} g - 绿色值
 * @param {number} b - 蓝色值
 * @returns {string} 十六进制颜色值
 */
export const rgbToHex = (r, g, b) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

/**
 * 调整颜色亮度
 * @param {string} color - 十六进制颜色值
 * @param {number} amount - 调整量 (正值变亮，负值变暗，范围 -100 到 100)
 * @returns {string} 调整后的十六进制颜色
 */
export const adjustBrightness = (color, amount) => {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  const factor = 1 + (amount / 100);

  const r = Math.min(255, Math.max(0, Math.round(rgb.r * factor)));
  const g = Math.min(255, Math.max(0, Math.round(rgb.g * factor)));
  const b = Math.min(255, Math.max(0, Math.round(rgb.b * factor)));

  return rgbToHex(r, g, b);
};

/**
 * 生成颜色的渐变序列
 * @param {string} baseColor - 基础颜色
 * @param {number} steps - 渐变步数
 * @returns {string[]} 颜色数组，从深到浅
 */
export const generateColorGradient = (baseColor, steps = 5) => {
  const colors = [];
  const rgb = hexToRgb(baseColor);
  if (!rgb) return [baseColor];

  for (let i = 0; i < steps; i++) {
    // 从原色到更浅的颜色
    // 第一个保持原色，后续逐渐变浅
    const lightnessFactor = i * (60 / (steps - 1)); // 最多增加60%的亮度
    colors.push(adjustBrightness(baseColor, lightnessFactor));
  }

  return colors;
};

/**
 * 根据FSA在区域中的位置获取对应的颜色
 * @param {string} baseColor - 基础颜色
 * @param {number} index - FSA在列表中的索引
 * @param {number} total - 总FSA数量
 * @param {number} groupSize - 每组的大小（默认10个为一组）
 * @returns {object} 包含颜色和透明度的对象
 */
export const getRegionFSAColor = (baseColor, index, total, groupSize = 10) => {
  // 计算组索引
  const groupIndex = Math.floor(index / groupSize);
  const totalGroups = Math.ceil(total / groupSize);

  if (totalGroups <= 1) {
    // 只有一组，使用原色
    return {
      color: baseColor,
      opacity: 0.7
    };
  }

  // 生成渐变色
  const gradientColors = generateColorGradient(baseColor, Math.min(totalGroups, 5));
  const colorIndex = Math.min(groupIndex, gradientColors.length - 1);

  // 计算透明度（第一组最不透明，后续组逐渐变透明）
  const minOpacity = 0.4;
  const maxOpacity = 0.8;
  const opacityRange = maxOpacity - minOpacity;
  const opacityStep = totalGroups > 1 ? opacityRange / (totalGroups - 1) : 0;
  const opacity = maxOpacity - (groupIndex * opacityStep);

  return {
    color: gradientColors[colorIndex],
    opacity: Math.max(minOpacity, opacity)
  };
};

/**
 * 混合两种颜色
 * @param {string} color1 - 第一种颜色
 * @param {string} color2 - 第二种颜色
 * @param {number} ratio - 混合比例 (0-1, 0=完全color1, 1=完全color2)
 * @returns {string} 混合后的颜色
 */
export const blendColors = (color1, color2, ratio = 0.5) => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return color1;

  const r = Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio);
  const g = Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio);
  const b = Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio);

  return rgbToHex(r, g, b);
};