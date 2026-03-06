const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        select: { id: true, email: true, role: true, createdAt: true }
    });
    console.log("USERS COUNT:", users.length);
    console.log("USERS:", users);

    const tasks = await prisma.task.findMany();
    console.log("TASKS COUNT:", tasks.length);
    console.log("TASKS:", tasks);
}
main().catch(console.error).finally(() => prisma.$disconnect());
