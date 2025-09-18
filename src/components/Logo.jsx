import React from 'react';

const Logo = ({ className = "", size = "default" }) => {
  const sizes = {
    small: { width: 600, height: 240 },
    default: { width: 800, height: 320 },
    large: { width: 1000, height: 400 },
    sidebar: { width: 300, height: 75 }  // 侧边栏宽度最大300px，高度75px
  };

  const { width, height } = sizes[size] || sizes.default;

  // 使用 public 文件夹中的 SVG 文件
  // 通过缩放和裁剪来去除 SVG 内部的空白
  return (
    <div className={`w-full h-full flex items-center justify-center overflow-hidden ${className}`}>
      <img
        src="/eie-logo.svg"
        alt="EIE Logo"
        style={{
          width: '200%',  // 放大2倍来裁剪掉空白
          height: 'auto',
          transform: 'scale(2.5)',  // 进一步放大2.5倍
          transformOrigin: 'center'
        }}
        className="object-contain"
        onError={(e) => {
          // 如果图片加载失败，显示文字 logo
          e.target.style.display = 'none';
          e.target.parentElement.innerHTML = `
            <div style="
              background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
              color: white;
              padding: 8px 16px;
              border-radius: 8px;
              font-weight: bold;
              font-size: 24px;
              font-family: 'Segoe UI', Arial, sans-serif;
            ">EIE</div>
          `;
        }}
      />
    </div>
  );
};

export default Logo;