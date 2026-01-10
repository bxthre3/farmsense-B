import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:farmsense@localhost:5432/farmsense';

// For migrations and queries
const client = postgres(connectionString);
export const db = drizzle(client, { schema });
