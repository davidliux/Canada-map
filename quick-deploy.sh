#!/bin/bash
# 快速部署脚本 - 先运行基础测试服务

echo "创建简单测试应用..."

# 创建测试index.html
cat > index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>加拿大地图系统 - 部署测试</title>
    <style>
        body { font-family: Arial; text-align: center; padding: 50px; }
        h1 { color: #2c3e50; }
        .status { padding: 20px; background: #27ae60; color: white; border-radius: 5px; margin: 20px auto; width: 300px; }
    </style>
</head>
<body>
    <h1>🗺️ 加拿大快递配送地图系统</h1>
    <div class="status">
        ✅ Nginx 正在运行<br>
        ⏳ 正在配置完整应用...
    </div>
    <p>服务器IP: 114.215.166.34</p>
    <p>当前时间: <span id="time"></span></p>
    <script>
        document.getElementById('time').innerText = new Date().toLocaleString();
    </script>
</body>
</html>
EOF

echo "启动Nginx容器..."
docker run -d \
  --name nginx-test \
  -p 80:80 \
  -v $(pwd)/index.html:/usr/share/nginx/html/index.html:ro \
  nginx:alpine

echo "服务已启动！"
echo "访问: http://114.215.166.34"
docker ps