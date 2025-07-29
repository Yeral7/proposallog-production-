const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const fs = require('fs').promises;

async function dumpDatabase() {
  try {
    console.log('Opening database...');
    const db = await open({
      filename: './database.db',
      driver: sqlite3.Database
    });

    console.log('Fetching table names...');
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    
    let sqlDump = 'PRAGMA foreign_keys=OFF;\nBEGIN TRANSACTION;\n';

    for (const table of tables) {
      const tableName = table.name;
      console.log(`Processing table: ${tableName}`);

      // Get table schema
      const schemaResult = await db.get(`SELECT sql FROM sqlite_master WHERE name = ?`, tableName);
      sqlDump += `${schemaResult.sql};\n`;

      // Get table data
      const rows = await db.all(`SELECT * FROM ${tableName}`);
      if (rows.length > 0) {
        for (const row of rows) {
          const columns = Object.keys(row).join(', ');
          const values = Object.values(row).map(val => {
            if (val === null) return 'NULL';
            // Escape single quotes by doubling them up
            return typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` : val;
          }).join(', ');
          sqlDump += `INSERT INTO \"${tableName}\" (${columns}) VALUES (${values});\n`;
        }
      }
    }

    sqlDump += 'COMMIT;\nPRAGMA foreign_keys=ON;\n';

    console.log('Writing to final_schema.sql...');
    await fs.writeFile('final_schema.sql', sqlDump);

    console.log('Database dump completed successfully.');

  } catch (error) {
    console.error('Failed to dump database:', error);
  } 
}

dumpDatabase();
