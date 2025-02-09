// server.js
const http = require('http');

// สร้าง server
const server = http.createServer((req, res) => {
  // ตั้งค่าหัวข้อและตอบกลับ
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello, world!\n');
});

// Server เริ่มฟังที่ port 8080
server.listen(8080, () => {
  console.log('Server is running on http://localhost:8080');
});
// server.js
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');

const app = express();

// ตั้งค่าการอัปโหลดไฟล์
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads'); // เก็บไฟล์ในโฟลเดอร์ uploads
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // ตั้งชื่อไฟล์ใหม่
  },
});

const upload = multer({ storage });

// เชื่อมต่อ MongoDB
mongoose.connect('mongodb://localhost:27017/mangaDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const mangaSchema = new mongoose.Schema({
  title: String,
  description: String,
  coverImage: String, // ไฟล์ภาพหน้าปก
  chapters: [
    {
      title: String,
      images: [String], // เก็บ URL รูปในแต่ละตอน
    },
  ],
});

const Manga = mongoose.model('Manga', mangaSchema);

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// เส้นทาง API

// เพิ่มมังงะใหม่
app.post('/api/manga', upload.single('coverImage'), async (req, res) => {
  const { title, description } = req.body;

  const newManga = new Manga({
    title,
    description,
    coverImage: `/uploads/${req.file.filename}`,
    chapters: [],
  });

  await newManga.save();
  res.json({ message: 'Manga created successfully!', manga: newManga });
});

// เพิ่มตอนใหม่ในมังงะ
app.post('/api/manga/:id/chapters', upload.array('images', 20), async (req, res) => {
  const { title } = req.body;
  const manga = await Manga.findById(req.params.id);

  if (!manga) {
    return res.status(404).json({ message: 'Manga not found' });
  }

  const newChapter = {
    title,
    images: req.files.map((file) => `/uploads/${file.filename}`),
  };

  manga.chapters.push(newChapter);
  await manga.save();

  res.json({ message: 'Chapter added successfully!', manga });
});

// อ่านรายชื่อมังงะทั้งหมด
app.get('/api/manga', async (req, res) => {
  const mangas = await Manga.find();
  res.json(mangas);
});

// อ่านรายละเอียดมังงะพร้อมตอน
app.get('/api/manga/:id', async (req, res) => {
  const manga = await Manga.findById(req.params.id);
  if (!manga) {
    return res.status(404).json({ message: 'Manga not found' });
  }
  res.json(manga);
});

// รันเซิร์ฟเวอร์
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
