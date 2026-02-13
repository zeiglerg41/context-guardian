import postgres from 'postgres';

/**
 * PostgreSQL connection using postgres.js
 */
export class Database {
  private sql: postgres.Sql;

  constructor(connectionString: string) {
    this.sql = postgres(connectionString, {
      max: 10, // Connection pool size
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }

  /**
   * Get the SQL client for queries
   */
  getClient(): postgres.Sql {
    return this.sql;
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    await this.sql.end();
  }

  /**
   * Health check - verify database is reachable
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.sql`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Singleton database instance
 */
let dbInstance: Database | null = null;

export function getDatabase(connectionString?: string): Database {
  if (!dbInstance) {
    const connStr = connectionString || process.env.DATABASE_URL;
    if (!connStr) {
      throw new Error('DATABASE_URL is not set');
    }
    dbInstance = new Database(connStr);
  }
  return dbInstance;
}
