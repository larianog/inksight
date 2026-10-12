-- SQL create function to create the Photos table in PostgreSQL
-- Database: PostgreSQL
-- Table name: Photos

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

-- To execute this function and create the table:
-- SELECT create_photos_table();
