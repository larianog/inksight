import { newDb } from 'pg-mem';
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const BLOBS_DIR = path.resolve(DATA_DIR, 'blobs');
const SNAPSHOT_FILE = path.resolve(DATA_DIR, 'photos_db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BLOBS_DIR)) {
  fs.mkdirSync(BLOBS_DIR, { recursive: true });
}

export const BLOBS_PATH = BLOBS_DIR;

export interface PhotoRecord {
  id: number;
  path: string;
  image_name: string | null;
  subjects: string | null;
  style: string;
  modern_traditional: string;
  placement: string;
  how: string;
  color: string;
  author: {
    name?: string;
    instagram?: string;
  };
}

export const SQL_CREATE_FUNCTION = `
-- SQL function to create the Photos table in PostgreSQL
CREATE TABLE IF NOT EXISTS "Photos" (
  id SERIAL PRIMARY KEY,
  path VARCHAR(2048) NOT NULL,
  "image name" VARCHAR(255),
  subjects TEXT,
  style VARCHAR(255) NOT NULL,
  modern_traditional VARCHAR(50) NOT NULL,
  placement VARCHAR(255) NOT NULL,
  how VARCHAR(50) NOT NULL,
  color VARCHAR(50) NOT NULL,
  author JSONB NOT NULL
);
`;

let dbInstance: any = null;
let pgPool: any = null;

export async function getDb() {
  if (!dbInstance) {
    const memDb = newDb();
    
    // Create standard PG adapter
    const adapter = memDb.adapters.createPg();
    pgPool = new adapter.Pool();
    dbInstance = memDb;

    // Run table creation
    await pgPool.query(SQL_CREATE_FUNCTION);

    // Load persisted state if exists, else seed initial records
    await loadOrSeedData(pgPool);
  }
  return pgPool;
}

async function persistData(pool: any) {
  try {
    const res = await pool.query('SELECT * FROM "Photos" ORDER BY id ASC');
    fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(res.rows, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist database state:', err);
  }
}

async function loadOrSeedData(pool: any) {
  if (fs.existsSync(SNAPSHOT_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) {
        for (const row of data) {
          await pool.query(
            `INSERT INTO "Photos" (id, path, "image name", subjects, style, modern_traditional, placement, how, color, author)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              row.id,
              row.path,
              row['image name'] || row.image_name,
              row.subjects,
              row.style,
              row.modern_traditional,
              row.placement,
              row.how,
              row.color,
              typeof row.author === 'string' ? JSON.parse(row.author) : row.author || {},
            ]
          );
        }
        return;
      }
    } catch (e) {
      console.warn('Could not read existing snapshot, re-seeding:', e);
    }
  }

  // Seed default curated photos
  const seedPhotos = [
    {
      path: 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?auto=format&fit=crop&w=1200&q=80',
      image_name: 'Japanese Ryu Dragon Full Sleeve',
      subjects: 'dragon, cherry blossoms, clouds, water waves',
      style: 'japanese',
      modern_traditional: 'traditional',
      placement: 'full sleeve',
      how: 'full',
      color: 'black and gray',
      author: { name: 'Kenji Takahashi', instagram: '@kenji_irezumi' },
    },
    {
      path: 'https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?auto=format&fit=crop&w=1200&q=80',
      image_name: 'Illustrative Botanical Flora & Ferns',
      subjects: 'peony, fern leaves, wild flora, botanical stem',
      style: 'illustrative works',
      modern_traditional: 'modern',
      placement: 'forearm',
      how: 'flash',
      color: 'black and gray',
      author: { name: 'Elena Rostova', instagram: '@elena_ink' },
    },
    {
      path: 'https://images.unsplash.com/photo-1562962230-16e4623d36e6?auto=format&fit=crop&w=1200&q=80',
      image_name: 'Neo-Traditional Tiger with Chrysanthemum',
      subjects: 'tiger, chrysanthemum flower, dagger, ornate filigree',
      style: 'neo-traditional',
      modern_traditional: 'modern',
      placement: 'thigh',
      how: 'full',
      color: 'colored',
      author: { name: 'Marcus Vance', instagram: '@vance_tattoo' },
    },
    {
      path: 'https://images.unsplash.com/photo-1560707303-4e980ce876ad?auto=format&fit=crop&w=1200&q=80',
      image_name: 'Geometric Sacred Mandala Chest Piece',
      subjects: 'mandala, sacred geometry, dotwork stippling, lotus',
      style: 'tribal',
      modern_traditional: 'modern',
      placement: 'chest',
      how: 'full',
      color: 'black and gray',
      author: { name: 'Aria Thorne', instagram: '@sacred_aria' },
    },
    {
      path: 'https://images.unsplash.com/photo-1542385151-efd9000785a0?auto=format&fit=crop&w=1200&q=80',
      image_name: 'Traditional Asiatic Koi Fish & Lotus',
      subjects: 'koi fish, lotus bloom, splash, oriental crest',
      style: 'asiatic',
      modern_traditional: 'traditional',
      placement: 'calf',
      how: 'flash',
      color: 'colored',
      author: { name: 'Hao Chen', instagram: '@haochen_ink' },
    },
    {
      path: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=1200&q=80',
      image_name: 'Chinese Mythical Phoenix Feathering',
      subjects: 'phoenix, celestial flames, sun disk',
      style: 'chinese',
      modern_traditional: 'traditional',
      placement: 'back',
      how: 'full',
      color: 'colored',
      author: { name: 'Li Wei', instagram: '@wei_oriental_art' },
    },
  ];

  for (const item of seedPhotos) {
    await pool.query(
      `INSERT INTO "Photos" (path, "image name", subjects, style, modern_traditional, placement, how, color, author)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        item.path,
        item.image_name,
        item.subjects,
        item.style,
        item.modern_traditional,
        item.placement,
        item.how,
        item.color,
        item.author,
      ]
    );
  }

  await persistData(pool);
}

export interface PhotoFilters {
  subject?: string | string[];
  style?: string | string[];
  modern_traditional?: string | string[];
  placement?: string | string[];
  how?: string | string[];
  color?: string | string[];
  author_name?: string | string[];
}

export async function getAllPhotos(filters?: PhotoFilters): Promise<PhotoRecord[]> {
  const pool = await getDb();
  let query = `
    SELECT 
      id, 
      path, 
      "image name" AS image_name, 
      subjects, 
      style, 
      modern_traditional, 
      placement, 
      how, 
      color, 
      author 
    FROM "Photos"
    WHERE 1=1
  `;
  const params: any[] = [];
  let paramIndex = 1;

  const toArray = (val?: string | string[]): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) {
      return val.flatMap((v) => String(v).split(',')).map((s) => s.trim()).filter(Boolean);
    }
    return String(val).split(',').map((s) => s.trim()).filter(Boolean);
  };

  const subjects = toArray(filters?.subject);
  if (subjects.length > 0) {
    const clauses = subjects.map((s) => {
      params.push(`%${s}%`);
      return `LOWER(subjects) LIKE LOWER($${paramIndex++})`;
    });
    query += ` AND (${clauses.join(' OR ')})`;
  }

  const styles = toArray(filters?.style);
  if (styles.length > 0) {
    const clauses = styles.map((st) => {
      params.push(`%${st}%`);
      return `LOWER(style) LIKE LOWER($${paramIndex++})`;
    });
    query += ` AND (${clauses.join(' OR ')})`;
  }

  const eras = toArray(filters?.modern_traditional);
  if (eras.length > 0) {
    const placeholders = eras.map((e) => {
      params.push(e);
      return `LOWER($${paramIndex++})`;
    });
    query += ` AND LOWER(modern_traditional) IN (${placeholders.join(', ')})`;
  }

  const placements = toArray(filters?.placement);
  if (placements.length > 0) {
    const clauses = placements.map((p) => {
      params.push(`%${p}%`);
      return `LOWER(placement) LIKE LOWER($${paramIndex++})`;
    });
    query += ` AND (${clauses.join(' OR ')})`;
  }

  const hows = toArray(filters?.how);
  if (hows.length > 0) {
    const placeholders = hows.map((h) => {
      params.push(h);
      return `LOWER($${paramIndex++})`;
    });
    query += ` AND LOWER(how) IN (${placeholders.join(', ')})`;
  }

  const colors = toArray(filters?.color);
  if (colors.length > 0) {
    const placeholders = colors.map((c) => {
      params.push(c);
      return `LOWER($${paramIndex++})`;
    });
    query += ` AND LOWER(color) IN (${placeholders.join(', ')})`;
  }

  const authors = toArray(filters?.author_name);
  if (authors.length > 0) {
    const clauses = authors.map((a) => {
      params.push(`%${a}%`);
      const idx = paramIndex++;
      return `(LOWER(author->>'name') LIKE LOWER($${idx}) OR LOWER(author->>'instagram') LIKE LOWER($${idx}))`;
    });
    query += ` AND (${clauses.join(' OR ')})`;
  }

  query += ` ORDER BY id DESC`;

  const res = await pool.query(query, params);
  return res.rows.map((row: any) => ({
    ...row,
    author: typeof row.author === 'string' ? JSON.parse(row.author) : row.author || {},
  }));
}

export async function getUniqueFilters() {
  const pool = await getDb();
  const res = await pool.query(`
    SELECT subjects, style, modern_traditional, placement, how, color, author FROM "Photos"
  `);

  const subjectsSet = new Set<string>();
  const stylesSet = new Set<string>();
  const modernTraditionalSet = new Set<string>();
  const placementSet = new Set<string>();
  const howSet = new Set<string>();
  const colorSet = new Set<string>();
  const authorNamesSet = new Set<string>();

  for (const row of res.rows) {
    if (row.subjects) {
      row.subjects.split(',').forEach((s: string) => {
        const val = s.trim();
        if (val) subjectsSet.add(val.toLowerCase());
      });
    }
    if (row.style) {
      row.style.split(',').forEach((st: string) => {
        const val = st.trim();
        if (val) stylesSet.add(val.toLowerCase());
      });
    }
    if (row.modern_traditional) modernTraditionalSet.add(row.modern_traditional.toLowerCase());
    if (row.placement) {
      row.placement.split(',').forEach((p: string) => {
        const val = p.trim();
        if (val) placementSet.add(val.toLowerCase());
      });
    }
    if (row.how) howSet.add(row.how.toLowerCase());
    if (row.color) colorSet.add(row.color.toLowerCase());

    const auth = typeof row.author === 'string' ? JSON.parse(row.author) : row.author;
    if (auth?.name) authorNamesSet.add(auth.name);
  }

  return {
    subjects: Array.from(subjectsSet).sort(),
    styles: Array.from(stylesSet).sort(),
    modern_traditional: Array.from(modernTraditionalSet).sort(),
    placements: Array.from(placementSet).sort(),
    how: Array.from(howSet).sort(),
    colors: Array.from(colorSet).sort(),
    authors: Array.from(authorNamesSet).sort(),
  };
}

export async function insertPhoto(photo: {
  path: string;
  image_name: string | null;
  subjects: string | null;
  style: string;
  modern_traditional: string;
  placement: string;
  how: string;
  color: string;
  author: { name?: string; instagram?: string };
}): Promise<PhotoRecord> {
  const pool = await getDb();
  const res = await pool.query(
    `INSERT INTO "Photos" (path, "image name", subjects, style, modern_traditional, placement, how, color, author)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, path, "image name" AS image_name, subjects, style, modern_traditional, placement, how, color, author`,
    [
      photo.path,
      photo.image_name,
      photo.subjects,
      photo.style,
      photo.modern_traditional,
      photo.placement,
      photo.how,
      photo.color,
      photo.author || {},
    ]
  );
  
  await persistData(pool);

  const row = res.rows[0];
  return {
    ...row,
    author: typeof row.author === 'string' ? JSON.parse(row.author) : row.author || {},
  };
}
