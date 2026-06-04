const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Datastore = require('nedb-promises');

const app = express();
const PORT = process.env.PORT || 3000;

// 使用 neDB 数据库替代 JSON 文件（数据持久化）
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const db = Datastore.create({ filename: path.join(__dirname, 'submissions.db'), autoload: true });

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const { className, studentId, name } = req.body;
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    cb(null, `${className}_${studentId}_${name}_${timestamp}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.zip', '.rar', '.7z', '.tar', '.gz'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持压缩包文件（zip/rar/7z/tar/gz）'));
    }
  },
  limits: { fileSize: 500 * 1024 * 1024 }
});

// 静态文件
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 提交接口
app.post('/api/submit', upload.single('file'), async (req, res) => {
  try {
    const { className, name, studentId } = req.body;
    if (!className || !name || !studentId || !req.file) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: '请填写完整信息并上传文件' });
    }

    // 查找是否已有该学号记录
    const existing = await db.findOne({ studentId });
    const record = {
      className,
      name,
      studentId,
      fileName: req.file.originalname,
      savedName: req.file.filename,
      fileSize: req.file.size,
      submitTime: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
    };

    if (existing) {
      // 删除旧文件
      const oldFile = path.join(UPLOAD_DIR, existing.savedName);
      if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
      await db.update({ studentId }, record);
    } else {
      await db.insert(record);
    }

    res.json({ success: true, message: existing ? '已更新提交' : '提交成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取所有提交记录
app.get('/api/submissions', async (req, res) => {
  const submissions = await db.find({}).sort({ submitTime: -1 });
  res.json(submissions);
});

// 删除提交记录（使用 _id）
app.delete('/api/submissions/:id', async (req, res) => {
  try {
    const record = await db.findOne({ _id: req.params.id });
    if (!record) {
      return res.status(400).json({ success: false, message: '记录不存在' });
    }
    const oldFile = path.join(UPLOAD_DIR, record.savedName);
    if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
    await db.remove({ _id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 下载文件
app.get('/api/download/:filename', (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ success: false, message: '文件不存在' });
  }
});

// 错误处理
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: '文件大小超过500MB限制' });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err.message === '仅支持压缩包文件（zip/rar/7z/tar/gz）') {
    return res.status(400).json({ success: false, message: err.message });
  }
  res.status(500).json({ success: false, message: '服务器错误' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`压缩包提交系统已启动: http://localhost:${PORT}`);
  console.log(`管理页面: http://localhost:${PORT}/admin.html`);
});