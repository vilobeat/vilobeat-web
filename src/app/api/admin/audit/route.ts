import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
    const session = await auth();
    // Broad read access for audit logs
    if (!session?.user || !["SUPER_ADMIN", "SUPPORT_STAFF", "FINANCE_MANAGER"].includes(session.user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        // We will fetch User creation, Role mutations, Royalties, and Withdrawals to synthesize an Audit Log if a dedicated Audit model doesn't exist

        const recentUsers = await prisma.user.findMany({
            take: 20,
            orderBy: { createdAt: 'desc' },
            select: { id: true, email: true, role: true, createdAt: true, artistName: true }
        });

        const recentRoyalties = await prisma.royaltyLedger.findMany({
            take: 20,
            orderBy: { date: 'desc' },
            include: { artist: { select: { email: true } } }
        });

        const recentWithdrawals = await prisma.withdrawalRequest.findMany({
            take: 20,
            orderBy: { createdAt: 'desc' },
            include: { artist: { select: { email: true } } }
        });

        // Synthesize logs
        const logs = [
            ...recentUsers.map((u: any) => ({
                id: `usr_${u.id}`,
                action: 'USER_CREATED',
                timestamp: u.createdAt,
                details: `New user ${u.email} joined as ${u.role}.`,
                type: 'INFO'
            })),
            ...recentRoyalties.map((r: any) => ({
                id: `roy_${r.id}`,
                action: 'REVENUE_ADDED',
                timestamp: r.date,
                details: `Added $${r.amount} to ${r.artist?.email} for track ID "${r.songId}".`,
                type: 'FINANCE'
            })),
            ...recentWithdrawals.map((w: any) => ({
                id: `wdr_${w.id}`,
                action: `WITHDRAWAL_${w.status}`,
                timestamp: w.createdAt,
                details: `Withdrawal of $${w.amount} is ${w.status} for ${w.artist?.email}.`,
                type: 'FINANCE'
            }))
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 50);

        return NextResponse.json({ logs });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
