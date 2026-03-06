import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import prisma from "@/lib/prisma"
import { getDspUnlockStatus, TIER_CONFIG } from "@/lib/subscriptions"

/**
 * GET /api/artist/dsp-status
 * Returns DSP unlock status for the authenticated artist.
 */
export async function GET(req: Request) {
    const session = await getSession(req)
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
        where: { id: (session as any).user?.id || (session as any).id },
        select: {
            subscriptionTier: true,
            subscriptionStartDate: true,
            dspUnlocked: true,
            dspUnlockPaidAt: true,
        },
    })

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const status = getDspUnlockStatus(
        user.subscriptionTier,
        user.subscriptionStartDate,
        user.dspUnlocked
    )

    const tierConfig = TIER_CONFIG[user.subscriptionTier] || TIER_CONFIG.BASIC

    return NextResponse.json({
        ...status,
        tier: user.subscriptionTier,
        tierName: tierConfig.name,
        dspUnlockPaidAt: user.dspUnlockPaidAt,
    })
}

/**
 * POST /api/artist/dsp-status
 * Pay the DSP unlock fee (marks as unlocked).
 * In production, this would integrate with Stripe/Paystack.
 */
export async function POST(req: Request) {
    const session = await getSession(req)
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
        where: { id: (session as any).user?.id || (session as any).id },
        select: {
            subscriptionTier: true,
            subscriptionStartDate: true,
            dspUnlocked: true,
        },
    })

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.dspUnlocked) {
        return NextResponse.json({ error: "DSP already unlocked" }, { status: 400 })
    }

    const status = getDspUnlockStatus(
        user.subscriptionTier,
        user.subscriptionStartDate,
        user.dspUnlocked
    )

    if (!status.eligibleForUnlock) {
        return NextResponse.json(
            { error: `You need ${status.monthsRemaining} more months of subscription.` },
            { status: 403 }
        )
    }

    // For Expert tier (fee = $0), unlock immediately
    // For other tiers, in production this would redirect to payment
    // For now, we simulate successful payment
    await prisma.user.update({
        where: { id: (session as any).user?.id || (session as any).id },
        data: {
            dspUnlocked: true,
            dspUnlockPaidAt: new Date(),
        },
    })

    return NextResponse.json({
        success: true,
        message: `DSP access unlocked! Fee: $${status.unlockFee}`,
    })
}
