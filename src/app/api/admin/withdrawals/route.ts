import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

/**
 * GET /api/admin/withdrawals
 * List all withdrawal requests (admin only).
 */
export async function GET() {
    const session = await auth()

    if (!session?.user || !["SUPER_ADMIN", "FINANCE_ADMIN", "SUPPORT_STAFF"].includes(session.user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const withdrawals = await prisma.withdrawalRequest.findMany({
        include: {
            artist: {
                select: {
                    email: true,
                    artistName: true,
                    walletBalance: true,
                    subscriptionTier: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ withdrawals })
}

/**
 * PUT /api/admin/withdrawals
 * Approve or reject a withdrawal (admin only).
 */
export async function PUT(req: Request) {
    const session = await auth()

    if (!session?.user || !["SUPER_ADMIN", "FINANCE_ADMIN"].includes(session.user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await req.json()
    const { withdrawalId, action, adminNote } = body
    // action: "APPROVED" | "REJECTED"

    if (!withdrawalId || !["APPROVED", "REJECTED"].includes(action)) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const withdrawal = await prisma.withdrawalRequest.findUnique({
        where: { id: withdrawalId },
    })

    if (!withdrawal || withdrawal.status !== "PENDING") {
        return NextResponse.json({ error: "Withdrawal not found or already processed" }, { status: 404 })
    }

    if (action === "APPROVED") {
        // Deduct from wallet balance
        await prisma.user.update({
            where: { id: withdrawal.artistId },
            data: {
                walletBalance: { decrement: withdrawal.amount },
            },
        })
    }

    // Update withdrawal status
    await prisma.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
            status: action,
            adminNote,
            processedById: session.user.id,
            processedAt: new Date(),
        },
    })

    // Log admin action
    await prisma.adminLog.create({
        data: {
            adminId: session.user.id!,
            action: `WITHDRAWAL_${action}`,
            targetId: withdrawalId,
            targetType: "WITHDRAWAL",
            meta: JSON.stringify({ amount: withdrawal.amount, artistId: withdrawal.artistId, adminNote }),
        },
    })

    return NextResponse.json({ success: true, message: `Withdrawal ${action.toLowerCase()}.` })
}
