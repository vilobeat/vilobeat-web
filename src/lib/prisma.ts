import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'
import path from 'path'

const getPrismaClient = () => {
  if (process.env.NODE_ENV === 'production') {
    let d1Binding = (process.env as any).vilobeat_db;

    // Explicit throw if binding is missing during a request
    if (!d1Binding) {
      console.warn("D1 Binding vilobeat_db is missing from process.env!");
    }

    const adapter = new PrismaD1(d1Binding);
    return new PrismaClient({ adapter });
  }

  // Fallback to local SQLite using better-sqlite3
  let dbPath = 'dev.db';
  if (typeof process !== 'undefined' && process.cwd) {
    dbPath = path.resolve(process.cwd(), 'dev.db');
  }

  const moduleName = '@prisma/adapter-better-sqlite3';
  const { PrismaBetterSqlite3 } = require(moduleName);
  const adapter = new PrismaBetterSqlite3({ url: dbPath });
  return new PrismaClient({ adapter });
};

declare const globalThis: {
  prismaGlobal: any;
} & typeof global;

// Lazy initialization via Proxy so process.env bindings are checked during the request!
const prisma = globalThis.prismaGlobal ?? new Proxy({} as any, {
  get(target, prop) {
    if (!target.__client) {
      target.__client = getPrismaClient();
    }
    return target.__client[prop];
  }
});

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
