#!/bin/bash

echo "🚀 加拿大快递配送系统 - GitHub推送脚本"
echo "================================================"
echo "📋 仅推送源代码，不包含构建产物"

# 测试SSH连接
echo "📡 测试GitHub SSH连接..."
if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
    echo "✅ SSH连接成功！"
else
    echo "❌ SSH连接失败，请确保已添加SSH key到GitHub账户"
    echo ""
    echo "SSH公钥内容:"
    cat ~/.ssh/id_ed25519.pub
    echo ""
    echo "请访问 https://github.com/settings/ssh/new 添加上述公钥"
    exit 1
fi

# 显示即将推送的内容
echo ""
echo "📦 即将推送的内容:"
echo "   ✅ React源代码 (src/目录)"
echo "   ✅ 项目配置文件 (package.json, vite.config.js等)"
echo "   ✅ 数据文件 (806个FSA数据)"
echo "   ✅ 构建脚本 (build_windows_app.sh)"
echo "   ✅ 文档文件 (README.md等)"
echo ""
echo "   ❌ 不推送: dist-electron/ (构建产物)"
echo "   ❌ 不推送: *.exe (打包文件)"
echo "   ❌ 不推送: node_modules/ (依赖)"

# 推送到GitHub
echo ""
echo "📤 推送源代码到GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 源代码推送成功！"
    echo "🌐 项目地址: https://github.com/davidliux/Canada-map"
    echo ""
    echo "📊 项目内容:"
    echo "   - React + Electron 源代码"
    echo "   - 806个FSA数据区域"
    echo "   - Windows构建脚本 (本地使用)"
    echo "   - 完整的开发文档"
    echo ""
    echo "💡 其他人可以:"
    echo "   1. git clone 获取源代码"
    echo "   2. npm install 安装依赖"
    echo "   3. npm run dev 启动开发版本"
    echo "   4. ./build_windows_app.sh 构建Windows应用"
else
    echo "❌ 推送失败，请检查网络连接和权限"
fi 