import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import prisma from "@/lib/prisma"

/**
 * GET /api/artist/withdrawals
 * Get all withdrawal requests for the authenticated artist.
 */
export async function GET(req: Request) {
    const session = await getSession(req)
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const withdrawals = await prisma.withdrawalRequest.findMany({
        where: { artistId: (session as any).user?.id || (session as any).id },
        orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ withdrawals })
}

/**
 * POST /api/artist/withdrawals
 * Request a withdrawal. Requires admin approval.
 */
export async function POST(req: Request) {
    const session = await getSession(req)
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { amount } = body

    if (!amount || amount <= 0) {
        return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    // Check wallet balance
    const user = await prisma.user.findUnique({
        where: { id: (session as any).user?.id || (session as any).id },
        select: { walletBalance: true },
    })

    if (!user || user.walletBalance < amount) {
        return NextResponse.json(
            { error: `Insufficient balance. Available: $${user?.walletBalance?.toFixed(2) || 0}` },
            { status: 400 }
        )
    }

    const withdrawal = await prisma.withdrawalRequest.create({
        data: {
            artistId: (session as any).user?.id || (session as any).id,
            amount,
        },
    })

    return NextResponse.json({
        success: true,
        withdrawal,
        message: "Withdrawal request submitted. Awaiting admin approval.",
    })
}
