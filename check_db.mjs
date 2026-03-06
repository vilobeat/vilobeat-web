import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({ select: { id: true, email: true, role: true, quota: true } });
    console.log(`Users count: ${users.length}`);
    console.log(JSON.stringify(users, null, 2));

    const tasks = await prisma.task.findMany();
    console.log(`Tasks count: ${tasks.length}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
