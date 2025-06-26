#!/bin/bash

# =======================================================
# 🚀 加拿大快递配送系统 - Windows版本完整构建脚本
# =======================================================
# 从React源码到Windows可执行文件的一站式构建方案
# 无需Python环境，包含所有依赖

echo "🚀 开始构建 Windows 版本应用..."
echo "================================================"

# 检查必要的工具
check_dependencies() {
    echo "🔍 检查构建环境..."
    
    if ! command -v npm &> /dev/null; then
        echo "❌ 未找到 npm，请先安装 Node.js"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        echo "❌ 未找到 node，请先安装 Node.js" 
        exit 1
    fi
    
    echo "✅ Node.js $(node --version)"
    echo "✅ npm $(npm --version)"
}

# 安装依赖
install_dependencies() {
    echo ""
    echo "📦 安装项目依赖..."
    
    if [ ! -d "node_modules" ]; then
        echo "   首次安装依赖，请耐心等待..."
        npm install
    else
        echo "   更新依赖..."
        npm install
    fi
    
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    
    echo "✅ 依赖安装完成"
}

# 构建React应用
build_react_app() {
    echo ""
    echo "⚡ 构建 React 应用..."
    
    # 清理之前的构建
    if [ -d "dist" ]; then
        rm -rf dist
        echo "   清理旧的构建文件"
    fi
    
    npm run build
    
    if [ $? -ne 0 ]; then
        echo "❌ React应用构建失败"
        exit 1
    fi
    
    echo "✅ React应用构建完成"
}

# 构建Electron应用
build_electron_app() {
    echo ""
    echo "🖥️ 构建 Electron 桌面应用..."
    
    # 清理之前的Electron构建
    if [ -d "dist-electron" ]; then
        rm -rf dist-electron
        echo "   清理旧的Electron构建文件"
    fi
    
    # 构建Windows版本（包含x64和ia32）
    echo "   正在构建Windows x64版本..."
    npx electron-builder --win --x64
    
    echo "   正在构建Windows ia32版本..."  
    npx electron-builder --win --ia32
    
    if [ $? -ne 0 ]; then
        echo "❌ Electron应用构建失败"
        exit 1
    fi
    
    echo "✅ Electron应用构建完成"
}

# 创建发布包
create_release_package() {
    echo ""
    echo "📦 创建Windows发布包..."
    
    # 创建发布目录
    RELEASE_DIR="Windows_Release_$(date +%Y%m%d_%H%M)"
    mkdir -p "$RELEASE_DIR"
    
    echo "   发布目录: $RELEASE_DIR"
    
    # 检查并复制构建文件
    if [ -f "dist-electron/加拿大快递邮编展示系统 Setup 1.0.0.exe" ]; then
        cp "dist-electron/加拿大快递邮编展示系统 Setup 1.0.0.exe" "$RELEASE_DIR/【推荐】加拿大快递邮编展示系统_安装包.exe"
        echo "   ✅ 复制安装包"
    else
        echo "   ⚠️ 安装包文件不存在，检查其他可能的文件名..."
        find dist-electron -name "*.exe" -type f | head -1 | xargs -I {} cp {} "$RELEASE_DIR/安装包.exe"
    fi
    
    # 复制绿色版本
    if [ -d "dist-electron/win-unpacked" ]; then
        cp -r "dist-electron/win-unpacked" "$RELEASE_DIR/绿色版_64位"
        echo "   ✅ 复制64位绿色版"
    fi
    
    if [ -d "dist-electron/win-ia32-unpacked" ]; then
        cp -r "dist-electron/win-ia32-unpacked" "$RELEASE_DIR/绿色版_32位" 
        echo "   ✅ 复制32位绿色版"
    fi
    
    # 创建使用说明
    create_documentation "$RELEASE_DIR"
    
    echo "✅ 发布包创建完成"
}

# 创建详细文档
create_documentation() {
    local release_dir=$1
    
    cat > "$release_dir/📋使用指南.txt" << 'EOF'
=======================================================
  🏆 加拿大快递配送系统 - Windows版本
=======================================================

🎯 功能特点：
• 806个真实FSA邮编区域可视化
• 按省份分组管理 (BC, ON, QC, AB, MB)
• 批量导入邮编，重复自动覆盖
• 基于Leaflet的高性能地图引擎
• 无需网络即可离线使用

📁 版本选择：

1. 【推荐】安装包.exe
   - 智能安装，自动适配系统
   - 创建桌面快捷方式和开始菜单
   - 支持自动更新

2. 绿色版_64位/
   - 适用于Windows 10/11 (64位)
   - 免安装，解压即用
   - 性能最佳

3. 绿色版_32位/
   - 适用于所有Windows版本
   - 更好的兼容性
   - 支持老旧系统

🚀 快速启动：
1. 选择合适的版本
2. 双击exe文件
3. 等待3-5秒加载
4. 开始使用！

💡 技术特性：
• 基于Electron框架，跨平台兼容
• React 18 + Vite 现代化前端
• 无需Python环境或其他依赖
• 包含所有必要的运行时库

⚠️ 系统要求：
• Windows 7 或更高版本
• 至少 2GB 内存
• 100MB 可用磁盘空间
• 可选：网络连接（在线地图瓦片）

📞 遇到问题？
• 检查Windows Defender设置
• 以管理员身份运行
• 确保路径不包含特殊字符
• 重启计算机后重试

版本信息：
构建时间: $(date '+%Y年%m月%d日 %H:%M')
技术栈: React + Electron + Leaflet
数据源: Statistics Canada FSA官方数据
=======================================================
EOF

    # 为每个版本创建单独的启动说明
    if [ -d "$release_dir/绿色版_64位" ]; then
        cat > "$release_dir/绿色版_64位/🚀双击启动.bat" << 'EOF'
@echo off
chcp 65001 >nul
echo 🚀 启动 加拿大快递配送系统 (64位版本)
echo 请稍等片刻...
start "" "加拿大快递邮编展示系统.exe"
EOF
    fi
    
    if [ -d "$release_dir/绿色版_32位" ]; then  
        cat > "$release_dir/绿色版_32位/🔧兼容版启动.bat" << 'EOF'
@echo off
chcp 65001 >nul
echo 🔧 启动 加拿大快递配送系统 (兼容版本)
echo 请稍等片刻...
start "" "加拿大快递邮编展示系统.exe"
EOF
    fi
}

# 显示构建结果
show_results() {
    echo ""
    echo "🎉 Windows版本构建完成！"
    echo "================================================"
    
    if [ -d "$RELEASE_DIR" ]; then
        echo "📁 发布目录: $RELEASE_DIR"
        echo ""
        echo "📊 文件大小："
        du -sh "$RELEASE_DIR"/* 2>/dev/null | sed 's/^/   /'
        echo ""
        echo "📦 总大小: $(du -sh "$RELEASE_DIR" | cut -f1)"
    fi
    
    echo ""
    echo "✅ 可分发的Windows应用已准备就绪！"
    echo "🚀 无需Python环境，可在任何Windows电脑上运行"
    echo "📋 详细说明请查看发布目录中的使用指南"
}

# 主执行流程
main() {
    check_dependencies
    install_dependencies  
    build_react_app
    build_electron_app
    create_release_package
    show_results
}

# 错误处理
set -e
trap 'echo "❌ 构建过程中发生错误，请检查上述输出"; exit 1' ERR

# 开始构建
main 