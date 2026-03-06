const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log("--- USERS ---");
    const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
    console.log(JSON.stringify(users, null, 2));

    console.log("--- TASKS ---");
    const tasks = await prisma.task.findMany({ select: { id: true, type: true, status: true, requestedById: true } });
    console.log(JSON.stringify(tasks, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
