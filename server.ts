import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import multer from 'multer';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  getAllPhotos,
  getUniqueFilters,
  insertPhoto,
  BLOBS_PATH,
  getDb,
} from './src/db/database.ts';
import { extractTattooTags } from './src/services/tagExtractor.ts';

dotenv.config();

const app = express();
const PORT = 3000;

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Multer storage for blob uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, BLOBS_PATH);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max per file
});

// Endpoint to serve blobs
app.get('/api/blobs/:filename', (req, res) => {
  const filename = req.params.filename;
  // Prevent directory traversal
  const safeFilename = path.basename(filename);
  const filePath = path.join(BLOBS_PATH, safeFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Blob not found' });
  }

  // Set appropriate content type
  const ext = path.extname(safeFilename).toLowerCase();
  let contentType = 'application/octet-stream';
  if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
  else if (ext === '.png') contentType = 'image/png';
  else if (ext === '.webp') contentType = 'image/webp';
  else if (ext === '.gif') contentType = 'image/gif';
  else if (ext === '.svg') contentType = 'image/svg+xml';

  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=86400');
  fs.createReadStream(filePath).pipe(res);
});

// GET /api/photos - with filters
app.get('/api/photos', async (req, res) => {
  try {
    const {
      subject,
      style,
      modern_traditional,
      placement,
      how,
      color,
      author_name,
    } = req.query;

    const photos = await getAllPhotos({
      subject: (subject as string | string[]) || undefined,
      style: (style as string | string[]) || undefined,
      modern_traditional: (modern_traditional as string | string[]) || undefined,
      placement: (placement as string | string[]) || undefined,
      how: (how as string | string[]) || undefined,
      color: (color as string | string[]) || undefined,
      author_name: (author_name as string | string[]) || undefined,
    });

    res.json(photos);
  } catch (error: any) {
    console.error('Failed to get photos:', error);
    res.status(500).json({ error: 'Failed to fetch photos from database' });
  }
});

// GET /api/filters - returns unique filter options fetched from database
app.get('/api/filters', async (_req, res) => {
  try {
    const filters = await getUniqueFilters();
    res.json(filters);
  } catch (error: any) {
    console.error('Failed to get filters:', error);
    res.status(500).json({ error: 'Failed to fetch filters from database' });
  }
});

// POST /api/upload - Handle multipart file upload (multi-file supported)
app.post('/api/upload', upload.array('photos', 20), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No photo files uploaded' });
    }

    const results = [];

    for (const file of files) {
      const fileBuffer = fs.readFileSync(file.path);
      const base64Data = fileBuffer.toString('base64');
      const mimeType = file.mimetype || 'image/jpeg';

      console.log(`Analyzing photo with Tag Extractor (Gemini 3.8 Flash): ${file.originalname}`);

      // Call LLM analyzer (Gemini 3.8 Flash, temp 0)
      const extracted = await extractTattooTags(
        base64Data,
        mimeType,
        file.originalname
      );

      const blobPath = `/api/blobs/${path.basename(file.path)}`;

      // Insert into PostgreSQL database
      const inserted = await insertPhoto({
        path: blobPath,
        image_name: extracted.name,
        subjects: extracted.subjects.join(', '),
        style: extracted.style.join(', '),
        modern_traditional: extracted.modern_traditional,
        placement: extracted.placement.join(', '),
        how: extracted.how,
        color: extracted.color,
        author: extracted.author,
      });

      results.push({
        photo: inserted,
        extracted,
        filename: file.originalname,
      });
    }

    res.status(201).json({
      success: true,
      count: results.length,
      photos: results,
    });
  } catch (error: any) {
    console.error('Upload & tag extraction error:', error);
    res.status(500).json({ error: error.message || 'Error processing photo upload pipeline' });
  }
});

// POST /api/upload-base64 - Support clipboard paste upload
app.post('/api/upload-base64', async (req, res) => {
  try {
    const { images } = req.body; // array of { base64, mimeType, name }
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'No image data received' });
    }

    const results = [];

    for (const img of images) {
      let rawBase64 = img.base64;
      let mimeType = img.mimeType || 'image/jpeg';

      if (rawBase64.includes(';base64,')) {
        const parts = rawBase64.split(';base64,');
        const matchMime = parts[0].match(/data:(.*)/);
        if (matchMime) mimeType = matchMime[1];
        rawBase64 = parts[1];
      }

      const buffer = Buffer.from(rawBase64, 'base64');
      const ext = mimeType.includes('png') ? '.png' : mimeType.includes('webp') ? '.webp' : '.jpg';
      const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
      const filePath = path.join(BLOBS_PATH, filename);

      fs.writeFileSync(filePath, buffer);

      const extracted = await extractTattooTags(rawBase64, mimeType, img.name);
      const blobPath = `/api/blobs/${filename}`;

      const inserted = await insertPhoto({
        path: blobPath,
        image_name: extracted.name,
        subjects: extracted.subjects.join(', '),
        style: extracted.style.join(', '),
        modern_traditional: extracted.modern_traditional,
        placement: extracted.placement.join(', '),
        how: extracted.how,
        color: extracted.color,
        author: extracted.author,
      });

      results.push({
        photo: inserted,
        extracted,
        filename: img.name || filename,
      });
    }

    res.status(201).json({
      success: true,
      count: results.length,
      photos: results,
    });
  } catch (error: any) {
    console.error('Base64 upload error:', error);
    res.status(500).json({ error: error.message || 'Error processing pasted image' });
  }
});

async function startServer() {
  // Ensure database initialized
  await getDb();

  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup error:', err);
});
