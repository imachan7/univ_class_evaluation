"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("../generated/prisma/client");
const adapter_libsql_1 = require("@prisma/adapter-libsql");
const databaseUrl = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (process.env.NODE_ENV === 'production' && !databaseUrl) {
    throw new Error('DATABASE_URL is required in production environment.');
}
const adapter = new adapter_libsql_1.PrismaLibSql({
    url: databaseUrl ?? 'file:dev.db',
    authToken: authToken,
});
const prisma = new client_1.PrismaClient({ adapter });
exports.default = prisma;
