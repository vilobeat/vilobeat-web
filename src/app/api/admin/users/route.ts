import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
    const session = await auth()

    if (!session?.user || !["SUPER_ADMIN", "SUPPORT_STAFF"].includes(session.user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const role = searchParams.get("role")
    const search = searchParams.get("search")
    const tier = searchParams.get("tier")
    const hasPending = searchParams.get("hasPending")
    const highWallet = searchParams.get("highWallet")
    const highQuota = searchParams.get("highQuota")

    const whereClause: any = {}

    if (role && role !== "ALL") {
        whereClause.role = role
    }

    if (search) {
        whereClause.email = { contains: search }
    }

    if (tier && tier !== "ALL") {
        whereClause.subscriptionTier = tier
    }

    if (hasPending === 'true') {
        whereClause.requestedTasks = { some: { status: 'PENDING' } };
    }

    if (highWallet === 'true') {
        whereClause.walletBalance = { gte: 100 }; // E.g., over $100
    }

    // Note: Filtering directly on high quota usage requires complex joins in Prisma 
    // without doing raw SQL. We will filter the basic query, then map in JS for simplicity on small datasets.

    let users = await prisma.user.findMany({
        where: whereClause,
        select: {
            id: true,
            email: true,
            artistName: true,
            role: true,
            subscriptionTier: true,
            createdAt: true,
            dspUnlocked: true,
            walletBalance: true,
            quota: true,
            _count: {
                select: { songs: true, requestedTasks: true }
            },
            requestedTasks: {
                where: { status: "PENDING" },
                select: { id: true }
            }
        },
        orderBy: { createdAt: "desc" },
    })

    // Compute synthetic metrics like DSP Unlock %, Status (Active/Suspended/Pending), and highQuota filter
    let mappedUsers = users.map((u: any) => {
        const isSuspended = false; // Add to schema later if needed, default active
        const pendingCount = u.requestedTasks?.length || 0;

        let status = 'Active';
        if (isSuspended) status = 'Suspended';
        else if (pendingCount > 0) status = 'Pending Requests';

        // Calculate a dummy DSP Unlock % based on if they have it unlocked or not.
        // If your business logic for % differs, you'd calculate it against required tasks here.
        const dspUnlockPercentage = u.dspUnlocked ? 100 : (u._count.songs * 15 > 75 ? 75 : u._count.songs * 15);

        let quotaUsedPercentage = 0;
        if (u.quota) {
            const totalUsed = u.quota.releasesUsed + u.quota.masteringUsed + u.quota.songCreationUsed + u.quota.coverCreationUsed + u.quota.lyricsUsed;
            // Assuming 50 is an arbitrary Elite limit for this calculation, adjust based on tier
            let tierLimit = 10;
            if (u.subscriptionTier === 'PRO') tierLimit = 25;
            if (u.subscriptionTier === 'ELITE') tierLimit = 75;
            if (u.subscriptionTier === 'EXPERT') tierLimit = 200;
            quotaUsedPercentage = Math.min(100, Math.round((totalUsed / tierLimit) * 100));
        }

        return {
            ...u,
            status,
            dspUnlockPercentage,
            quotaUsedPercentage
        };
    });

    if (highQuota === 'true') {
        mappedUsers = mappedUsers.filter(u => u.quotaUsedPercentage >= 80);
    }

    return NextResponse.json({ users: mappedUsers })
}
