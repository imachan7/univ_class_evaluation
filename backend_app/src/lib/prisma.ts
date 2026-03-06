import 'dotenv/config';
import { PrismaClient } from '../generated/prisma';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const databaseUrl = process.env.DATABASE_URL;

if (process.env.NODE_ENV === 'production' && !databaseUrl) {
  throw new Error('DATABASE_URL is required in production environment.');
}

const adapter = new PrismaLibSql({
  url: databaseUrl ?? 'file:dev.db',
});

const prisma = new PrismaClient({ adapter });

export default prisma;
