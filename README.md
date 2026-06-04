# 压缩包提交系统

班级大作业压缩包提交系统 —— 学生上传压缩包，教师后台管理。

## 技术栈

- **后端**: Node.js + Express
- **前端**: 原生 HTML + CSS
- **文件存储**: 本地文件系统

## 本地运行

`ash
# 安装依赖
npm install

# 启动服务
npm start

# 打开浏览器访问
# http://localhost:3000
# 管理后台: http://localhost:3000/admin.html
`

## 部署到云端（让别人能通过网址访问）

### 方式一：Render.com（推荐，免费）

1. 将代码推送到 GitHub

2. 打开 [Render.com](https://render.com) 并注册/登录（支持 GitHub 登录）

3. 点击 **New +** → **Web Service**

4. 选择你的 GitHub 仓库

5. 填写配置：
   - **Name**: zip-submit-system
   - **Environment**: Node
   - **Build Command**: 
pm install --production
   - **Start Command**: 
ode server.js
   - **Plan**: Free（免费）

6. 点击 **Create Web Service**，等待几分钟即可访问

> Render 会自动分配一个 https://zip-submit-system.onrender.com 这样的网址

### 方式二：Railway.app（推荐，免费）

1. 将代码推送到 GitHub

2. 打开 [Railway.app](https://railway.app) 并注册

3. 点击 **New Project** → **Deploy from GitHub repo**

4. 选择你的仓库，Railway 会自动检测 Node.js 项目

5. 部署完成后，点击 **Generate Domain** 获取公网地址

### 方式三：使用 Docker（自行部署到服务器）

`ash
# 构建镜像
docker build -t zip-submit-system .

# 运行容器
docker run -d -p 3000:3000 --name zip-submit zip-submit-system
`

## 项目结构

`
├── public/
│   ├── index.html       # 学生提交页面
│   ├── admin.html       # 管理后台页面
│   └── digimon.jpg      # 背景图片
├── uploads/             # 上传文件存储目录（自动创建）
├── server.js            # 后端服务
├── package.json         # 项目配置
├── Procfile             # 部署平台配置
├── Dockerfile           # Docker 构建文件
├── render.yaml          # Render 自动部署配置
└── .github/workflows/   # GitHub Actions CI 配置
`

## 功能

- ✅ 学生提交姓名、学号、班级 + 压缩包文件
- ✅ 支持 .zip / .rar / .7z / .tar / .gz 格式
- ✅ 单文件最大 500MB
- ✅ 重复提交自动覆盖旧文件
- ✅ 管理后台查看/删除/下载提交记录
- ✅ 学号去重，自动更新

## 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| PORT | 服务端口 | 3000 |
