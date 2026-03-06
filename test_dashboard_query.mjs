import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const [
        totalUsers,
        activeSubscriptions,
        pendingDistribution,
        pendingMastering,
        pendingLyricsMusic,
        pendingWithdrawals,
        platformRevenue,
        artistRevenueOwed,
        recentSignups,
        recentSongs,
        recentTasks,
        recentWithdrawals
    ] = await Promise.all([
        prisma.user.count({ where: { role: "ARTIST" } }),
        prisma.user.count({ where: { role: "ARTIST", subscriptionTier: { not: "BASIC" } } }),
        prisma.task.count({ where: { type: "DISTRIBUTION", status: "PENDING" } }),
        prisma.task.count({ where: { type: "MASTERING", status: "PENDING" } }),
        prisma.task.count({ where: { type: "LYRICS_TO_MUSIC", status: "PENDING" } }),
        prisma.withdrawalRequest.count({ where: { status: "PENDING" } }),
        prisma.user.findMany({ where: { subscriptionTier: { not: "BASIC" } }, select: { subscriptionTier: true } }),
        prisma.user.aggregate({ _sum: { walletBalance: true }, where: { role: "ARTIST" } }),
        prisma.user.findMany({ select: { id: true, email: true, createdAt: true }, where: { role: "ARTIST" }, orderBy: { createdAt: "desc" }, take: 5 }),
        prisma.song.findMany({ select: { id: true, title: true, createdAt: true, artist: { select: { email: true } } }, orderBy: { createdAt: "desc" }, take: 5 }),
        prisma.task.findMany({ select: { id: true, type: true, status: true, updatedAt: true, requestedBy: { select: { email: true } } }, orderBy: { updatedAt: "desc" }, take: 5 }),
        prisma.withdrawalRequest.findMany({ select: { id: true, amount: true, createdAt: true, artist: { select: { email: true } } }, orderBy: { createdAt: "desc" }, take: 5 })
    ])

    console.log("Recent Tasks Output:");
    console.log(JSON.stringify(recentTasks, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
