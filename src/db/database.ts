import fs from 'node:fs';
import path from 'node:path';

const BLOBS_DIR = path.resolve(process.cwd(), 'data', 'blobs');

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
  image_name VARCHAR(255),
  subjects TEXT,
  style VARCHAR(255) NOT NULL,
  modern_traditional VARCHAR(50) NOT NULL,
  placement VARCHAR(255) NOT NULL,
  how VARCHAR(50) NOT NULL,
  color VARCHAR(50) NOT NULL,
  author JSONB NOT NULL
);
`;

import pg from 'pg';
const { Pool } = pg;

let pgPool: Pool | null = null;

export async function getDb(): Promise<Pool> {
  if (!pgPool) {
    console.log('Connecting to PostgreSQL database using environment variables...');
    
    const pool = process.env.DATABASE_URL
      ? new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
          connectionTimeoutMillis: 4000,
        })
      : new Pool({
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432', 10),
          database: process.env.DB_NAME || 'inksight_db',
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || '',
          ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
          connectionTimeoutMillis: 4000,
        });

    // Test connectivity and create table
    await pool.query('SELECT 1');
    await pool.query(SQL_CREATE_FUNCTION);
    
    pgPool = pool;
    console.log('Successfully connected to PostgreSQL database!');
  }
  return pgPool;
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
      image_name AS image_name, 
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
    `INSERT INTO "Photos" (path, image_name, subjects, style, modern_traditional, placement, how, color, author)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, path, image_name AS image_name, subjects, style, modern_traditional, placement, how, color, author`,
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

  const row = res.rows[0];
  return {
    ...row,
    author: typeof row.author === 'string' ? JSON.parse(row.author) : row.author || {},
  };
}
