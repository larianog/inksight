# InkSight — Tattoo Gallery & AI Tag Extractor

InkSight is a full-stack web application designed for tattoo enthusiasts, studios, and collectors. It combines a photo gallery with an automated ingestion pipeline powered by **Gemini 3.8 Flash** (`temperature: 0`) and a **PostgreSQL** database.

The application features a mystery design aesthetic using tones of **black, cyan, and purple**, with a seamless toggle between **Dark** and **Light** modes.

---

## Features

- **Home Gallery Page**:
  - Filter bar supporting **multi-selection (checkboxes)** across 7 categories:
    1. **Subject** (e.g. dragon, peony, skull, mandala)
    2. **Style** (e.g. japanese, illustrative works, neo-traditional, tribal, chinese, asiatic)
    3. **Era / Modern vs. Traditional** (`modern`, `traditional`)
    4. **Placement** (e.g. full sleeve, forearm, chest, back, thigh)
    5. **Coverage / How** (`full`, `flash`, `free`)
    6. **Color Palette** (`black and gray`, `colored`)
    7. **Author / Tattoo Artist**
  - **Add Photo button** placed right next to the filter buttons.
  - Hovering any tattoo photo displays the **Image Name**, **Author / Artist**, and **Instagram handle** (`@handle`).
  - Clicking any card opens a high-resolution inspection modal with complete tag metadata.
  - Interactive **Light / Dark Mode switch** in the header.

- **Add Photo Page**:
  - Drag-and-drop file picker supporting multiple photos at once.
  - **Clipboard Paste (`Ctrl+V` / `Cmd+V`)** support for instant uploads.
  - **Automated AI Pipeline**:
    1. Stores image in server Blob storage (`/api/blobs/:filename`).
    2. Sends the image to the LLM Tag Extractor (**Gemini 3.8 Flash** at temperature `0`).
    3. Inserts extracted structured metadata directly into PostgreSQL.
  - Upon completion, displays extracted element cards with options to **Upload New Photos** or **Return to Gallery**.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion.
- **Backend**: Node.js, Express, Multer (multipart blob uploads).
- **AI Model**: Google Gemini (`@google/genai` SDK, `gemini-3.8-flash`, temperature `0`).
- **Database**: PostgreSQL (supports external Postgres, Cloud SQL, Supabase, Neon, or built-in embedded engine).

---

## Environment Variables Configuration

Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

### Environment Variables Details

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini API key for AI tattoo extraction | `AIzaSy...` (Get from [Google AI Studio](https://aistudio.google.com/)) |
| `PORT` | Application server port | `3000` |
| `APP_URL` | Public application URL | `http://localhost:3000` |
| `DB_HOST` | PostgreSQL server hostname or IP | `localhost` |
| `DB_PORT` | PostgreSQL server port | `5432` |
| `DB_NAME` | Database name | `inksight_db` |
| `DB_USER` | PostgreSQL username | `postgres` |
| `DB_PASSWORD` | PostgreSQL password / passkey | `your_secure_password` |
| `DB_SSL` | Enable SSL (`true` for Cloud SQL / Supabase / Neon) | `false` |
| `DATABASE_URL` | *(Optional)* Direct connection URI | `postgresql://user:pass@localhost:5432/inksight_db` |

> **Note on Database Connection**: If `DB_HOST` or `DATABASE_URL` is configured, InkSight connects directly to your external PostgreSQL instance. If left blank or in offline local development, InkSight automatically falls back to its built-in embedded PostgreSQL engine with local file persistence in `./data`, ensuring the app runs immediately without any setup hurdles!

---

## How to Run the Project Locally

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9+ (or pnpm / yarn)
- **PostgreSQL**: Optional (a local or remote instance can be connected via `.env`)

### 2. Installation

Clone or extract the repository and install all dependencies:

```bash
npm install
```

### 3. Configure `.env`

Copy `.env.example` to `.env` and configure your API key and database settings:

```bash
cp .env.example .env
```

Open `.env` in your editor and enter your credentials:

```ini
GEMINI_API_KEY="your_actual_gemini_api_key_here"

# Database credentials
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="inksight_db"
DB_USER="postgres"
DB_PASSWORD="your_database_password_here"
DB_SSL="false"
```

### 4. Run Development Server

Start the full-stack server (Express backend + Vite client middleware):

```bash
npm run dev
```

Once started, open your browser and navigate to:
```
http://localhost:3000
```

### 5. Production Build & Run

To build the optimized client bundle and run in production mode:

```bash
# 1. Build the frontend
npm run build

# 2. Start the production server
npm start
```

---

## PostgreSQL Database Schema

InkSight uses a single `Photos` table in PostgreSQL. The table can be initialized using the SQL function below (found in `src/db/schema.sql`):

```sql
-- PostgreSQL function to create the Photos table
CREATE OR REPLACE FUNCTION create_photos_table()
RETURNS void AS $$
BEGIN
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
END;
$$ LANGUAGE plpgsql;

-- Execute the creation function:
SELECT create_photos_table();
```

### Columns

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `SERIAL PRIMARY KEY` | Auto-incrementing identifier |
| `path` | `VARCHAR(2048)` | Path to image in Blob storage (`/api/blobs/...`) |
| `image name` | `VARCHAR(255)` | Descriptive tattoo name extracted by LLM |
| `subjects` | `TEXT` | Extracted subjects and figures (comma-separated) |
| `style` | `VARCHAR(255)` | Tattoo style (e.g., japanese, illustrative, tribal) |
| `modern_traditional` | `VARCHAR(50)` | Era classification (`modern` or `traditional`) |
| `placement` | `VARCHAR(255)` | Body placement (e.g., full sleeve, forearm, chest) |
| `how` | `VARCHAR(50)` | Coverage type (`full`, `flash`, or `free`) |
| `color` | `VARCHAR(50)` | Color scheme (`black and gray` or `colored`) |
| `author` | `JSONB` | Artist details: `{"name": "...", "instagram": "@..."}` |

---

## Tag Extractor Prompt & Model

The tag extractor uses **Gemini 3.8 Flash** (`model: "gemini-3.8-flash"`) with `temperature: 0` to produce structured JSON:

```json
{
  "name": "Full sleeve japanese dragon",
  "subjects": ["dragon", "cherry blossoms", "water waves"],
  "style": ["japanese"],
  "modern_traditional": "traditional",
  "placement": ["full sleeve"],
  "how": "full",
  "color": "black and gray",
  "author": {
    "name": "Kenji Takahashi",
    "instagram": "@kenji_irezumi"
  }
}
```

---

## License

Apache-2.0
