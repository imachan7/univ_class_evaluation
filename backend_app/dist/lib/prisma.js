"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("../generated/prisma/client");
const adapter_libsql_1 = require("@prisma/adapter-libsql");
const client_2 = require("@libsql/client");
const databaseUrl = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
// Debug logs
console.log("Database URL prefix:", databaseUrl?.substring(0, 10));
console.log("Auth Token length:", authToken?.length);
if (!databaseUrl)
    console.error("Missing DATABASE_URL");
if (!authToken)
    console.error("Missing TURSO_AUTH_TOKEN");
if (process.env.NODE_ENV === "production" && !databaseUrl) {
    throw new Error("DATABASE_URL is required in production environment.");
}
const libsql = (0, client_2.createClient)({
    url: databaseUrl ?? "file:dev.db",
    authToken: authToken,
});
const adapter = new adapter_libsql_1.PrismaLibSql(libsql);
const prisma = new client_1.PrismaClient({ adapter });
exports.default = prisma;
