import { createConnection } from 'mysql2/promise';
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '../db/migrations');

// Usage: node scripts/migrate.js <up|down> [namePrefix]
//   up                 -> apply every *.up.sql   in ascending order
//   down               -> apply every *.down.sql in descending order (newest first)
//   up|down 001        -> only the migration(s) whose filename starts with "001"
const direction = (process.argv[2] || 'up').toLowerCase();
const only = process.argv[3];

if (!['up', 'down'].includes(direction)) {
  console.error('Usage: node scripts/migrate.js <up|down> [namePrefix]');
  process.exit(1);
}

function migrationFiles() {
  const suffix = `.${direction}.sql`;
  let files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(suffix));
  if (only) files = files.filter((f) => f.startsWith(only));
  files.sort();
  if (direction === 'down') files.reverse(); // roll back newest-first
  return files;
}

async function run() {
  const files = migrationFiles();
  if (!files.length) {
    console.log(`No ${direction} migrations found${only ? ` for "${only}"` : ''}.`);
    return;
  }

  const connection = await createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gym_db',
    multipleStatements: true,
  });

  try {
    for (const file of files) {
      console.log(`Applying (${direction}): ${file}`);
      const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
      await connection.query(sql);
    }
    console.log(`Migrations ${direction} complete (${files.length} file(s)).`);
  } finally {
    await connection.end();
  }
}

run().catch((err) => {
  console.error('Migration failed:', {
    message: err.message,
    code: err.code,
    errno: err.errno,
    sqlState: err.sqlState,
    sqlMessage: err.sqlMessage,
  });
  process.exit(1);
});
