import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()

    if (!session?.user || !["SUPER_ADMIN", "SUPPORT_STAFF"].includes(session.user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    try {
        const { id: userId } = await params;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                quota: true,
                songs: {
                    orderBy: { createdAt: 'desc' },
                    include: { royaltySplits: true }
                },
                requestedTasks: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        assignedTo: { select: { email: true, artistName: true } }
                    }
                },
                royalties: {
                    orderBy: { date: 'desc' }
                },
                withdrawalRequests: {
                    orderBy: { createdAt: 'desc' }
                },
                coverArts: {
                    orderBy: { createdAt: 'desc' }
                },
                lyrics: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Calculate Overview Metrics (Section A)
        const totalRevenueGenerated = user.royalties.reduce((sum, r) => sum + r.amount, 0);

        let dspUnlockPercentage = 100;
        if (!user.dspUnlocked) {
            const progress = user.songs.length * 15; // Simulated 15% per song for MVP
            dspUnlockPercentage = progress > 75 ? 75 : progress;
        }

        let quotaUsedPercentage = 0;
        let quotaDetails = { used: 0, total: 10 };
        if (user.quota) {
            const totalUsed = user.quota.releasesUsed + user.quota.masteringUsed + user.quota.songCreationUsed + user.quota.coverCreationUsed + user.quota.lyricsUsed;
            let tierLimit = 10;
            if (user.subscriptionTier === 'PRO') tierLimit = 25;
            if (user.subscriptionTier === 'ELITE') tierLimit = 75;
            if (user.subscriptionTier === 'EXPERT') tierLimit = 200;

            quotaUsedPercentage = Math.min(100, Math.round((totalUsed / tierLimit) * 100));
            quotaDetails = { used: totalUsed, total: tierLimit };
        }

        // Add calculated fields to user object
        const enhancedUser = {
            ...user,
            overview: {
                totalRevenueGenerated,
                dspUnlockPercentage,
                quotaUsedPercentage,
                quotaDetails,
                totalSongsDistributed: user.songs.length,
                status: user.requestedTasks.some(t => t.status === 'PENDING') ? 'Pending Requests' : 'Active'
            }
        };

        return NextResponse.json({ user: enhancedUser })
    } catch (e: any) {
        console.error("Failed to fetch user details:", e);
        return NextResponse.json({ error: e.message || "Internal Service Error" }, { status: 500 })
    }
}
