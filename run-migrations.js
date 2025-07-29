const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = './database.db';
const migrationsDir = path.join(__dirname, 'db/migrations');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the database.');
});

const getAppliedMigrations = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT version FROM schema_migrations', (err, rows) => {
      if (err) {
        // If the table doesn't exist, create it and return an empty set.
        if (err.message.includes('no such table: schema_migrations')) {
          console.log('`schema_migrations` table not found. Creating it...');
          db.run(`
            CREATE TABLE schema_migrations (
              version TEXT PRIMARY KEY,
              applied_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
          `, (createErr) => {
            if (createErr) {
              return reject(new Error('Failed to create schema_migrations table:', createErr));
            }
            console.log('✓ `schema_migrations` table created.');
            resolve(new Set());
          });
        } else {
          reject(new Error('Error fetching applied migrations:', err));
        }
      } else {
        resolve(new Set(rows.map(r => r.version)));
      }
    });
  });
};

const runMigration = async () => {
  try {
    const appliedMigrations = await getAppliedMigrations();
    const allMigrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    let pendingMigrations = 0;
    for (const file of allMigrationFiles) {
      const version = path.basename(file, '.sql');
      if (!appliedMigrations.has(version)) {
        pendingMigrations++;
        console.log(`\nApplying migration: ${version}...`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        
        await new Promise((resolve, reject) => {
          db.exec(sql, (err) => {
            if (err) {
              return reject(new Error(`Failed to apply migration ${version}: ${err.message}`));
            }
            db.run('INSERT INTO schema_migrations (version) VALUES (?)', [version], (insertErr) => {
              if (insertErr) {
                return reject(new Error(`Failed to record migration ${version}: ${insertErr.message}`));
              }
              console.log(`✓ Successfully applied and recorded migration: ${version}`);
              resolve();
            });
          });
        });
      }
    }

    if (pendingMigrations === 0) {
      console.log('\nDatabase is already up to date. No new migrations to apply.');
    } else {
      console.log(`\nSuccessfully applied ${pendingMigrations} new migration(s).`);
    }

  } catch (error) {
    console.error('Migration failed:', error.message);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('Error closing database connection:', err.message);
      }
      console.log('Database connection closed.');
    });
  }
};

runMigration();
