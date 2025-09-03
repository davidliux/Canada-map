#!/bin/bash

# 加拿大快递邮编展示系统 - Windows版本打包脚本
# 作者: Canada Postal Delivery System
# 日期: 2025-06-06

echo "🚀 开始打包Windows版本..."

# 创建发布目录
RELEASE_DIR="Windows_Release_$(date +%Y%m%d)"
mkdir -p "$RELEASE_DIR"

# 复制安装包版本
echo "📦 复制安装包版本..."
cp "dist-electron/加拿大快递邮编展示系统 Setup 1.0.0.exe" "$RELEASE_DIR/"

# 复制绿色版本
echo "📁 复制绿色版本..."
cp -r "dist-electron/win-arm64-unpacked" "$RELEASE_DIR/绿色版本"

# 复制说明文档
echo "📋 复制说明文档..."
cp "Windows发布说明.md" "$RELEASE_DIR/"

# 创建快速启动说明
cat > "$RELEASE_DIR/快速使用指南.txt" << EOF
==============================================
  加拿大快递邮编展示系统 - 快速使用指南
==============================================

🎯 两种使用方式：

【方式一：安装版（推荐）】
1. 双击运行："加拿大快递邮编展示系统 Setup 1.0.0.exe"
2. 按照向导完成安装
3. 从桌面快捷方式启动

【方式二：绿色版】
1. 进入"绿色版本"文件夹
2. 双击运行："加拿大快递邮编展示系统.exe"

💡 注意事项：
- 首次启动可能需要几秒钟加载
- 需要网络连接来加载地图瓦片
- 如有问题请查看"Windows发布说明.md"

==============================================
EOF

# 显示文件大小信息
echo ""
echo "📊 文件大小统计："
echo "├── 安装包版本: $(du -h "$RELEASE_DIR/加拿大快递邮编展示系统 Setup 1.0.0.exe" | cut -f1)"
echo "├── 绿色版本: $(du -sh "$RELEASE_DIR/绿色版本" | cut -f1)"
echo "└── 总大小: $(du -sh "$RELEASE_DIR" | cut -f1)"

echo ""
echo "✅ 打包完成！"
echo "📁 发布目录: $RELEASE_DIR"
echo ""
echo "🎯 分发指南："
echo "1. 将整个 '$RELEASE_DIR' 文件夹压缩为zip"
echo "2. 发送给您的同事"
echo "3. 同事解压后按照'快速使用指南.txt'操作"
echo ""
echo "🚀 您的同事现在可以直接使用专业的邮编展示系统了！" 