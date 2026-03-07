import { NextResponse, NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import prisma from "@/lib/prisma"

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(req: NextRequest) {
    const secret = process.env.NEXTAUTH_SECRET || "vilobeat-super-secret-key-for-local-dev-replace-later";
    const token = await getToken({ req, secret });

    if (!token || token.role === "ARTIST") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

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

        // No explicit transaction table yet, using MRR estimation for active subs mapping
        prisma.user.findMany({ where: { subscriptionTier: { not: "BASIC" } }, select: { subscriptionTier: true } }),

        prisma.user.aggregate({ _sum: { walletBalance: true }, where: { role: "ARTIST" } }),

        // Activity Feed
        prisma.user.findMany({ select: { id: true, email: true, createdAt: true }, where: { role: "ARTIST" }, orderBy: { createdAt: "desc" }, take: 5 }),
        prisma.song.findMany({ select: { id: true, title: true, createdAt: true, artist: { select: { email: true } } }, orderBy: { createdAt: "desc" }, take: 5 }),
        prisma.task.findMany({ select: { id: true, type: true, status: true, updatedAt: true, requestedBy: { select: { email: true } } }, orderBy: { updatedAt: "desc" }, take: 5 }),
        prisma.withdrawalRequest.findMany({ select: { id: true, amount: true, createdAt: true, artist: { select: { email: true } } }, orderBy: { createdAt: "desc" }, take: 5 })
    ])

    // Calculate MRR (Monthly Recurring Revenue) estimation for Platform Revenue
    const tierPrices: Record<string, number> = { PRO: 25, ELITE: 42, EXPERT: 80 };
    const estimatedMRR = platformRevenue.reduce((acc: number, user: { subscriptionTier: string }) => acc + (tierPrices[user.subscriptionTier] || 0), 0);


    const activities = [
        ...recentSignups.map((u: any) => ({ id: `user_${u.id}`, type: 'USER_SIGNUP', title: 'New user signup', desc: u.email, date: u.createdAt })),
        ...recentSongs.map((s: any) => ({ id: `song_${s.id}`, type: 'SONG_SUBMITTED', title: 'Song submitted', desc: `"${s.title}" by ${s.artist.email}`, date: s.createdAt })),
        ...recentTasks.map((t: any) => ({ id: `task_${t.id}`, type: 'TASK_COMPLETED', title: `${t.type.replace(/_/g, ' ')} ${t.status === 'COMPLETED' ? 'completed' : 'requested'}`, desc: `Requested by ${t.requestedBy.email}`, date: t.updatedAt })),
        ...recentWithdrawals.map((w: any) => ({ id: `with_${w.id}`, type: 'WITHDRAWAL_REQUEST', title: 'Withdrawal requested', desc: `$${w.amount} requested by ${w.artist.email}`, date: w.createdAt }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 15);

    return NextResponse.json({
        metrics: {
            totalUsers,
            activeSubscriptions,
            pendingDistribution,
            pendingMastering,
            pendingLyricsMusic,
            pendingWithdrawals,
            totalPlatformRevenue: estimatedMRR,
            totalArtistRevenueOwed: artistRevenueOwed._sum.walletBalance || 0
        },
        feed: activities
    })
}
