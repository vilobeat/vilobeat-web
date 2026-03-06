import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaD1 } from '@prisma/adapter-d1'
import path from 'path'

const prismaClientSingleton = () => {
  // Try to use Cloudflare D1 first from global/env context if deployed
  if (process.env.NODE_ENV === 'production') {
    // In edge runtime, we get the binding from the context
    let d1Binding = null;

    // Cloudflare Pages/OpenNext exposes the binding via process.env
    d1Binding = (process.env as any).vilobeat_db

    if (d1Binding) {
      const adapter = new PrismaD1(d1Binding)
      return new PrismaClient({ adapter })
    }
  }

  // Fallback to local SQLite using better-sqlite3
  // Make sure we only require this in Node environments
  let dbPath;
  if (typeof process !== 'undefined' && process.cwd) {
    dbPath = path.resolve(process.cwd(), 'dev.db')
  } else {
    dbPath = 'dev.db'; // fallback
  }

  // Note: better-sqlite3 can't run on Edge, but this branch only hits in local dev/Node
  const adapter = new PrismaBetterSqlite3({ url: dbPath })
  return new PrismaClient({ adapter })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
