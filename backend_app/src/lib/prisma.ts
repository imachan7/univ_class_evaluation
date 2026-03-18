import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const databaseUrl = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (process.env.NODE_ENV === "production" && !databaseUrl) {
  throw new Error("DATABASE_URL is required in production environment.");
}

const libsql = createClient({
  url: databaseUrl ?? "file:dev.db",
  authToken: authToken,
});

const adapter = new PrismaLibSql(libsql as any);
const prisma = new PrismaClient({ adapter });

export default prisma;
