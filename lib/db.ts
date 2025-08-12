// Updated to use Supabase PostgreSQL instead of SQLite
import { supabase } from './supabase';

// Export the Supabase client directly for API routes
export function getDb() {
  return supabase;
}

// For backward compatibility, create a function that returns the supabase client
export async function getDatabase() {
  return supabase;
}

// Reset function (no longer needed for Supabase but kept for compatibility)
export function resetDbConnection() {
  console.log('Database connection reset (Supabase handles connections automatically)');
}
