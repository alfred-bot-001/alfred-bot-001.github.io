#!/bin/bash
# zkKYC — 一键部署启动脚本 / One-click deploy & start
set -e

cd "$(dirname "$0")"

# 创建虚拟环境（如果不存在）
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# 激活虚拟环境 & 安装依赖
echo "📦 Installing dependencies..."
./venv/bin/pip install -q -r requirements.txt

# 启动服务
echo "🚀 Starting zkKYC server on http://localhost:8099"
echo "   Tech view:  http://localhost:8099/"
echo "   User view:  http://localhost:8099/user-demo.html"
echo ""
./venv/bin/python app.py
