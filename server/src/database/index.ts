import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import type { Bindings } from '../types';

// Helper function to get environment variables from both contexts
function getEnvVar(key: keyof Bindings, env?: Bindings): string | undefined {
  // First try from Cloudflare Workers context
  if (env && env[key]) {
    return env[key];
  }
  // Fallback to process.env for local development
  return process.env[key];
}

// Create database connection factory that accepts environment variables
export function createDatabase(env?: Bindings) {
  // Get environment variables with fallback to process.env
  const dbHost = getEnvVar('DB_HOST', env);
  const dbPort = getEnvVar('DB_PORT', env);
  const dbUser = getEnvVar('DB_USER', env);
  const dbPassword = getEnvVar('DB_PASSWORD', env);
  const dbName = getEnvVar('DB_NAME', env);
  const dbSsl = getEnvVar('DB_SSL', env);
  const databaseUrl = getEnvVar('DATABASE_URL', env);

  // Validate required environment variables
  const requiredVars = [
    { name: 'DB_HOST', value: dbHost },
    { name: 'DB_PORT', value: dbPort },
    { name: 'DB_USER', value: dbUser },
    { name: 'DB_PASSWORD', value: dbPassword },
    { name: 'DB_NAME', value: dbName }
  ];
  
  const missingVars = requiredVars.filter(v => !v.value).map(v => v.name);
  
  if (!databaseUrl && missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  let connectionString: string;
  
  if (databaseUrl) {
    connectionString = databaseUrl;
  } else {
    // URL encode the password to handle special characters
    const encodedPassword = encodeURIComponent(dbPassword!);
    const encodedUser = encodeURIComponent(dbUser!);
    
    connectionString = `postgresql://${encodedUser}:${encodedPassword}@${dbHost}:${dbPort}/${dbName}`;
  }

  // Validate the connection string format
  try {
    new URL(connectionString);
  } catch (error) {
    console.error('Invalid database connection string format:', connectionString.replace(/:[^:]*@/, ':***@'));
    throw new Error('Invalid database connection string format');
  }

  const client = postgres(connectionString, { 
    prepare: false,
    ssl: dbSsl === 'true' ? 'require' : false
  });
  
  return drizzle(client, { schema });
}

// For backward compatibility and local development (when process.env is available)
const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'password'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'workshop_tools'}`;

const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
