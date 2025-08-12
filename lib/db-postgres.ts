import { Client } from 'pg';

let client: Client | null = null;
let connectionError: Error | null = null;

export async function getPostgresDb(): Promise<Client> {
  // Return existing connection if available
  if (client) {
    return client;
  }

  // If we had a previous connection error, throw it again
  if (connectionError) {
    console.error('Using previously failed PostgreSQL connection:', connectionError);
    throw connectionError;
  }

  try {
    console.log('Connecting to PostgreSQL...');
    
    client = new Client({
      connectionString: process.env.POSTGRES_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });

    await client.connect();
    console.log('✅ Connected to PostgreSQL successfully');
    
    return client;
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL:', error);
    connectionError = error as Error;
    client = null;
    throw error;
  }
}

export async function resetPostgresConnection(): Promise<void> {
  if (client) {
    try {
      await client.end();
    } catch (error) {
      console.error('Error closing PostgreSQL connection:', error);
    }
  }
  client = null;
  connectionError = null;
  console.log('PostgreSQL connection reset');
}

// Utility function to execute queries with proper error handling
export async function executeQuery(query: string, params: any[] = []): Promise<any> {
  const db = await getPostgresDb();
  try {
    const result = await db.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Query execution error:', error);
    console.error('Query:', query);
    console.error('Params:', params);
    throw error;
  }
}

// Utility function to execute a single query and return first row
export async function executeQuerySingle(query: string, params: any[] = []): Promise<any> {
  const rows = await executeQuery(query, params);
  return rows[0] || null;
}
