# Database Schema Migrations

This folder contains all database schema migration scripts for the CRM dashboard application.

## Migration Process

Each migration script is versioned with a prefix like `v1.0.0_` followed by a descriptive name that indicates what changes were made. This versioning allows for better tracking of database schema changes over time.

### How to Apply Migrations

For SQLite databases, apply a migration using:

```bash
sqlite3 ../dashboard.db < v1.0.0_migration_name.sql
```

## Migration Files

- **v1.0.0_remove_divisions.sql**: Removes division-related functionality from the database schema while preserving all other data. This includes removing the divisions table, project_divisions junction table, and division_id foreign key from the users table.

## Safety Measures

All migrations include:

1. Transaction wrapping to ensure all changes are applied atomically
2. Schema migration tracking in a dedicated table
3. Data preservation where possible (migrations try to avoid data loss)
4. Clear output messages to confirm successful application

## Creating New Migrations

When creating new migrations:

1. Use proper versioning (increment appropriately)
2. Give descriptive names
3. Include transaction handling
4. Add migration tracking
5. Test migration in development before applying to production
6. Document the migration in this README file
