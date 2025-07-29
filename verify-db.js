const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Simple script to verify the database is intact
const db = new sqlite3.Database('./database.db', sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to database successfully');
  
  // Check if projects table exists and has data
  db.get('SELECT COUNT(*) as count FROM projects', (err, result) => {
    if (err) {
      console.error('Error checking projects table:', err.message);
    } else {
      console.log(`Your projects table contains ${result.count} projects.`);
      
      // Show first few projects to verify data
      if (result.count > 0) {
        db.all('SELECT * FROM projects LIMIT 3', (err, projects) => {
          if (err) {
            console.error('Error retrieving projects:', err.message);
          } else {
            console.log('\nHere are the first few projects (confirming data exists):');
            projects.forEach(project => {
              console.log(`- Project ID: ${project.id}, Name: ${project.name}`);
            });
          }
          
          // Close connection
          db.close(() => {
            console.log('\nDatabase connection closed');
          });
        });
      } else {
        db.close();
      }
    }
  });
});
