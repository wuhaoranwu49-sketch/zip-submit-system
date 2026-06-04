# 压缩包提交系统 🚀

班级大作业压缩包提交系统 —— 学生上传压缩包，教师后台管理。

## 在线地址

| 环境 | 地址 | 说明 |
|------|------|------|
| Vercel | https://zip-submit-system.vercel.app | 查看静态页面可用 |
| Render | 部署中... | 完整功能（支持文件上传） |

## 技术栈

- **后端**: Node.js + Express
- **前端**: 原生 HTML + CSS
- **文件存储**: 本地文件系统（Render 持久化）

## 本地运行

`ash
npm install
npm start
# 打开 http://localhost:3000
# 管理后台 http://localhost:3000/admin.html
`

## 自动构建

每次推送代码到 main 分支，Vercel / Render 会自动重新构建部署：
- GitHub 仓库：https://github.com/wuhaoranwu49-sketch/zip-submit-system
- 无需手动操作，git push 即自动更新

## 功能

- ✅ 学生提交姓名、学号、班级 + 压缩包文件
- ✅ 支持 .zip / .rar / .7z / .tar / .gz 格式
- ✅ 单文件最大 500MB
- ✅ 重复提交自动覆盖旧文件
- ✅ 管理后台查看/删除/下载提交记录