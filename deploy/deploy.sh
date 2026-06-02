#!/bin/bash
# =============================================
# 鸭梨手机AI客服 - 阿里云一键部署脚本
# 使用方法:
#   1. SSH登录服务器: ssh root@121.40.129.113
#   2. 执行: bash deploy.sh
# =============================================
set -e

echo "=========================================="
echo " 鸭梨手机AI客服 - 服务器部署开始"
echo "=========================================="

# ── 1. 系统更新 ──
echo ""
echo "[1/8] 更新系统包..."
sudo apt update && sudo apt upgrade -y

# ── 2. 安装依赖 ──
echo ""
echo "[2/8] 安装环境依赖..."
sudo apt install -y python3 python3-pip python3-venv git nginx mysql-server nodejs npm

# ── 3. 配置MySQL ──
echo ""
echo "[3/8] 配置MySQL数据库..."
sudo systemctl start mysql
sudo systemctl enable mysql

sudo mysql -e "
CREATE DATABASE IF NOT EXISTS yali_phone CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'yali_user'@'localhost' IDENTIFIED BY 'YaliPhone@2024!';
GRANT ALL PRIVILEGES ON yali_phone.* TO 'yali_user'@'localhost';
FLUSH PRIVILEGES;
SELECT 'Database yali_phone created successfully' AS '';
"

# ── 4. 克隆项目 ──
echo ""
echo "[4/8] 克隆项目代码..."
if [ -d /opt/yali-phone ]; then
    echo "项目目录已存在，拉取最新代码..."
    cd /opt/yali-phone && git pull origin main
else
    git clone https://github.com/cattle-horses45/xiaoya.git /opt/yali-phone
    cd /opt/yali-phone
fi

# ── 5. 配置后端环境 ──
echo ""
echo "[5/8] 配置后端环境变量..."
cat > /opt/yali-phone/backend/.env << 'EOF'
# Database
DATABASE_URL=mysql+pymysql://yali_user:YaliPhone@2024!@localhost:3306/yali_phone

# JWT
SECRET_KEY=yali-phone-production-secret-key-2024
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# DeepSeek API
DEEPSEEK_API_KEY=sk-a6b593b706fc4482842754d94bcc0a90
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat

# App
APP_NAME=鸭梨手机AI客服
DEBUG=false
EOF

# 安装Python依赖
cd /opt/yali-phone/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 初始化数据库表
python init_db.py

# ── 6. 配置systemd服务 ──
echo ""
echo "[6/8] 配置后端systemd服务..."
sudo tee /etc/systemd/system/yali-backend.service << 'EOF'
[Unit]
Description=Yali Phone Backend Service
After=network.target mysql.service

[Service]
User=root
WorkingDirectory=/opt/yali-phone/backend
ExecStart=/opt/yali-phone/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
EnvironmentFile=/opt/yali-phone/backend/.env

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now yali-backend

# ── 7. 构建前端 + 配置Nginx ──
echo ""
echo "[7/8] 构建前端并进行Nginx配置..."
cd /opt/yali-phone/frontend
npm install && npm run build

sudo tee /etc/nginx/sites-available/yali-phone << 'EOF'
server {
    listen 80;
    server_name 121.40.129.113;

    root /opt/yali-phone/frontend/dist;
    index index.html;

    # SPA路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/yali-phone /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# ── 8. 验证部署 ──
echo ""
echo "[8/8] 验证部署..."
sleep 2

echo ""
echo "=== 后端健康检查 ==="
curl -s http://127.0.0.1:8000/api/health

echo ""
echo "=== 前端页面 ==="
curl -s -o /dev/null -w "HTTP Status: %{http_code}" http://127.0.0.1/

echo ""
echo ""
echo "=========================================="
echo " 部署完成！"
echo "=========================================="
echo " 前端地址: http://121.40.129.113"
echo " API文档:  http://121.40.129.113/api/docs"
echo " API健康:  http://121.40.129.113/api/health"
echo ""
echo " 管理员: admin / admin123"
echo " 登录后台: http://121.40.129.113/admin"
echo "=========================================="
