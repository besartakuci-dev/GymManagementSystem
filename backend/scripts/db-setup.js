import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

async function setup() {
  // No database specified — the schema SQL creates and selects gym_db itself
  const connection = await createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  try {
    console.log('Creating schema...');
    const schema = readFileSync(join(__dirname, '../db/01_gym_schema_simple.sql'), 'utf8');
    await connection.query(schema);
    console.log('Schema ready.');

    console.log('Inserting seed data...');
    const seed = readFileSync(join(__dirname, '../db/02_gym_seed_data_simple.sql'), 'utf8');
    await connection.query(seed);
    console.log('Seed data inserted.');

    console.log('Database setup complete — gym_db is ready.');
  } finally {
    await connection.end();
  }
}

setup().catch((err) => {
  console.error('Database setup failed:', {
    message: err.message,
    code: err.code,
    errno: err.errno,
    sqlState: err.sqlState,
    sqlMessage: err.sqlMessage,
  });
  process.exit(1);
});
