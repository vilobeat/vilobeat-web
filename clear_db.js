const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');

const dbPath = path.resolve(process.cwd(), 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
    await prisma.taskHistory.deleteMany({});
    await prisma.analytics.deleteMany({});
    await prisma.royaltySplit.deleteMany({});
    await prisma.coverArt.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.song.deleteMany({});
    console.log('All tasks, songs, and related data cleared successfully');
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); });
