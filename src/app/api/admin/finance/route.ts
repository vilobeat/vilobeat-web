import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    let isAuthorized = ["SUPER_ADMIN", "FINANCE_MANAGER", "FINANCE_ADMIN"].includes(session.user.role);

    if (!isAuthorized) {
        const customRole = await prisma.adminRole.findUnique({ where: { name: session.user.role } });
        if (customRole && customRole.permissions.includes("MANAGE_FINANCE")) {
            isAuthorized = true;
        }
    }

    if (!isAuthorized) {
        return NextResponse.json({ error: "Unauthorized (Requires MANAGE_FINANCE permission)" }, { status: 403 });
    }

    try {
        // 1. Total Platform Earnings (Sum of all revenues platform has claimed - simplified for MVP to total subscription revenue)
        // Note: Real world would include percentage of splits, but for MVP we just sum subscriptions + add a mock number if Subscriptions aren't tracked via Stripe yet.
        const users = await prisma.user.findMany({ select: { walletBalance: true, subscriptionTier: true } });
        const totalArtistBalances = users.reduce((sum, u) => sum + u.walletBalance, 0);

        // 2. Pending and Completed Withdrawals
        const pendingWithdrawalsCount = await prisma.withdrawalRequest.count({ where: { status: 'PENDING' } });
        const completedWithdrawals = await prisma.withdrawalRequest.aggregate({
            where: { status: 'PAID' },
            _sum: { amount: true }
        });

        // 3. Transactions Log
        // Fetch last 50 Royalties (Credits)
        const royalties = await prisma.royaltyLedger.findMany({
            take: 50,
            orderBy: { date: 'desc' },
            include: { artist: { select: { artistName: true, email: true } } }
        });

        // Fetch last 50 Withdrawals (Debits)
        const withdrawals = await prisma.withdrawalRequest.findMany({
            take: 50,
            orderBy: { createdAt: 'desc' },
            include: { artist: { select: { artistName: true, email: true } } }
        });

        // Map them into a unified format
        const unifiedTransactions = [
            ...royalties.map(r => ({
                id: `rt_${r.id}`,
                type: 'CREDIT',
                category: 'ROYALTY',
                amount: r.amount,
                date: r.date,
                description: r.description || `Royalty Payment`,
                user: r.artist,
                status: 'COMPLETED'
            })),
            ...withdrawals.map(w => ({
                id: `wd_${w.id}`,
                type: 'DEBIT',
                category: 'WITHDRAWAL',
                amount: w.amount,
                date: w.createdAt,
                description: `Withdrawal Request`,
                user: w.artist,
                status: w.status
            }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 50);

        return NextResponse.json({
            stats: {
                totalPlatformEarnings: 15420.50, // Mock for MVP since Subscriptions aren't payment linked yet
                totalArtistBalances,
                pendingWithdrawalsCount,
                completedWithdrawalsAmount: completedWithdrawals._sum.amount || 0
            },
            transactions: unifiedTransactions
        });
    } catch (error: any) {
        console.error("Finance API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
