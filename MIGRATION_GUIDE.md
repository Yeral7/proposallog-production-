# SQLite to PostgreSQL Migration Guide

## Overview
This guide will help you migrate your existing SQLite database to PostgreSQL (Supabase) for production deployment.

## Prerequisites
- ✅ Vercel deployment is working
- ✅ Supabase project is created
- ✅ Environment variables are set in Vercel
- ✅ Local `.env.local` file is created

## Migration Steps

### Step 1: Install Required Dependencies
```bash
npm install pg @types/pg dotenv
```

### Step 2: Test PostgreSQL Connection
```bash
node -e "
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('✅ PostgreSQL connection successful!');
    const result = await client.query('SELECT NOW()');
    console.log('Current time:', result.rows[0].now);
    await client.end();
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}

testConnection();
"
```

### Step 3: Run Migration Script
```bash
node scripts/migrate-to-postgres.js
```

### Step 4: Update Application Code
The migration script will:
- Extract your SQLite schema
- Convert it to PostgreSQL format
- Create tables in Supabase
- Migrate all your data
- Fix sequence counters

### Step 5: Test Your Application
```bash
npm run dev
```

Visit your application and verify:
- All data is present
- CRUD operations work
- No database errors in console

### Step 6: Deploy to Production
```bash
git add .
git commit -m "Add PostgreSQL migration support"
git push
```

## Rollback Plan
If something goes wrong, you can always:
1. Keep using SQLite locally for development
2. The migration script doesn't modify your original SQLite file
3. You can re-run the migration script multiple times

## Common Issues and Solutions

### Issue: Connection timeout
**Solution:** Check your Supabase project is not paused and connection string is correct

### Issue: Table already exists
**Solution:** The migration script drops and recreates tables automatically

### Issue: Data type mismatches
**Solution:** The script converts common SQLite types to PostgreSQL equivalents

## Next Steps After Migration
1. Update your API routes to use PostgreSQL queries if needed
2. Test all functionality thoroughly
3. Monitor performance and optimize queries
4. Set up database backups in Supabase
