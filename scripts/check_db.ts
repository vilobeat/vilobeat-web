import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("--- USERS ---");
    const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
    console.log(users);

    console.log("--- TASKS ---");
    const tasks = await prisma.task.findMany({ select: { id: true, type: true, status: true, requestedById: true } });
    console.log(tasks);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
