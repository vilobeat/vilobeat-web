import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import prisma from "@/lib/prisma"
import { getDspUnlockStatus, getQuotaUsage, TIER_CONFIG } from "@/lib/subscriptions"

export async function GET(req: Request) {
    const session = await getSession(req)
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session as any).user?.id || (session as any).id

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            email: true,
            artistName: true,
            profilePictureUrl: true,
            subscriptionTier: true,
            subscriptionStartDate: true,
            dspUnlocked: true,
            walletBalance: true,
        },
    })

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Parallel queries for dashboard data
    const [songCount, totalStreams, royaltySum, activeTasks, completedTasks, recentSongs, quota] =
        await Promise.all([
            prisma.song.count({ where: { artistId: userId } }),
            prisma.analytics.aggregate({
                where: { artistId: userId },
                _sum: { totalStreams: true },
            }),
            prisma.royaltyLedger.aggregate({
                where: { artistId: userId },
                _sum: { amount: true },
            }),
            prisma.task.findMany({
                where: { requestedById: userId, status: { in: ["PENDING", "IN_PROGRESS"] } },
                include: { song: { select: { title: true } } },
                orderBy: { createdAt: "desc" },
            }),
            prisma.task.findMany({
                where: { requestedById: userId, status: "COMPLETED" },
                include: { song: { select: { title: true } } },
                orderBy: { updatedAt: "desc" },
                take: 10,
            }),
            prisma.song.findMany({
                where: { artistId: userId },
                orderBy: { createdAt: "desc" },
                take: 10,
            }),
            prisma.quota.findUnique({
                where: { artistId: userId },
            }),
        ])

    // DSP unlock status
    const dspStatus = getDspUnlockStatus(
        user.subscriptionTier,
        user.subscriptionStartDate,
        user.dspUnlocked
    )

    // Quota usage
    const tierConfig = TIER_CONFIG[user.subscriptionTier] || TIER_CONFIG.BASIC
    const quotaUsage = getQuotaUsage(user.subscriptionTier, quota)

    return NextResponse.json({
        // User info
        artistName: user.artistName || user.email.split("@")[0],
        profilePictureUrl: user.profilePictureUrl,
        subscriptionTier: user.subscriptionTier,
        tierName: tierConfig.name,
        tierColor: tierConfig.color,

        // Summary stats
        totalSongs: songCount,
        totalStreams: totalStreams._sum.totalStreams || 0,
        royaltyBalance: royaltySum._sum.amount || 0,
        walletBalance: user.walletBalance,
        activeTaskCount: activeTasks.length,

        // DSP unlock
        dspStatus,

        // Quota usage
        quotaUsage,

        // Lists
        activeTasks,
        completedTasks,
        recentSongs,
    })
}
