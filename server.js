const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");
const ws = require("ws");

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, "uploads");

const supabaseUrl = "https://emxyfpbfekccxwqjlvqi.supabase.co";
const supabaseKey = "sb_publishable_7QxCwnLFM3YTS6sEchRRpw_KyEAWZBS";
const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: { transport: ws }
});

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const { studentId } = req.body;
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    const safeName = studentId + "_" + timestamp;
    cb(null, safeName + ext);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedExts = [".zip", ".rar", ".7z", ".tar", ".gz"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only compressed files allowed"));
    }
  },
  limits: { fileSize: 500 * 1024 * 1024 }
});

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post("/api/submit", upload.single("file"), async (req, res) => {
  try {
    const { className, name, studentId } = req.body;
    if (!className || !name || !studentId || !req.file) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: "Please fill all fields" });
    }

    const submitTime = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
    const record = {
      class_name: className, name, student_id: studentId,
      file_name: req.file.originalname, saved_name: req.file.filename,
      file_size: req.file.size, submit_time: submitTime
    };

    // Upload file to Supabase Storage
    const fileBuffer = fs.readFileSync(req.file.path);
    const { error: uploadError } = await supabase.storage.from("wenjian").upload(req.file.filename, fileBuffer, { contentType: "application/octet-stream", upsert: true });
    if (uploadError) console.error("Storage upload error:", uploadError.message);
    fs.unlinkSync(req.file.path);

    const { data: existing } = await supabase.from("submissions").select("*").eq("student_id", studentId).maybeSingle();

    if (existing) {
      await supabase.storage.from("wenjian").remove([existing.saved_name]);
      await supabase.from("submissions").update(record).eq("student_id", studentId);
      res.json({ success: true, message: "Updated" });
    } else {
      await supabase.from("submissions").insert(record);
      res.json({ success: true, message: "Submitted" });
    }
  } catch (err) {
    console.error("Submit error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/submissions", async (req, res) => {
  try {
    const { data } = await supabase.from("submissions").select("*").order("submit_time", { ascending: false });
    const mapped = (data || []).map(r => ({
      id: r.id,
      className: r.class_name,
      name: r.name,
      studentId: r.student_id,
      fileName: r.file_name,
      savedName: r.saved_name,
      fileSize: r.file_size,
      submitTime: r.submit_time
    }));
    res.json(mapped);
  } catch (err) {
    res.json([]);
  }
});

app.delete("/api/submissions/:id", async (req, res) => {
  try {
    const { data } = await supabase.from("submissions").select("*").eq("id", req.params.id).single();
    if (!data) return res.status(400).json({ success: false, message: "Not found" });
    await supabase.storage.from("wenjian").remove([data.saved_name]);
    await supabase.from("submissions").delete().eq("id", req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/download/:filename", async (req, res) => {
  try {
    const { data } = supabase.storage.from("wenjian").getPublicUrl(req.params.filename);
    if (data && data.publicUrl) {
      res.redirect(data.publicUrl);
    } else {
      res.status(404).json({ success: false, message: "File not found" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ success: false, message: "File too large (500MB max)" });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  res.status(500).json({ success: false, message: "Server error" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Supabase app started");
});
