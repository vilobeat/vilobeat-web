import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import crypto from "crypto"

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY

export async function POST(req: Request) {
    const url = new URL(req.url)
    const provider = url.searchParams.get("provider")

    if (provider === "stripe") {
        return handleStripeWebhook(req)
    } else if (provider === "paystack") {
        return handlePaystackWebhook(req)
    }

    return NextResponse.json({ error: "Unknown provider" }, { status: 400 })
}

async function handleStripeWebhook(req: Request) {
    try {
        const body = await req.text()
        // In production, verify the Stripe signature using the webhook secret
        // const sig = req.headers.get("stripe-signature")
        // For now, parse the event directly
        const event = JSON.parse(body)

        if (event.type === "checkout.session.completed") {
            const session = event.data.object
            const userId = session.metadata?.userId || session.client_reference_id
            const tier = session.metadata?.tier

            if (userId && tier) {
                await updateUserSubscription(userId, tier, "stripe", session.subscription)
            }
        }

        if (event.type === "customer.subscription.deleted") {
            const subscription = event.data.object
            const userId = subscription.metadata?.userId
            if (userId) {
                await updateUserSubscription(userId, "BASIC", "stripe", null)
            }
        }

        return NextResponse.json({ received: true })
    } catch (error: any) {
        console.error("Stripe webhook error:", error)
        return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
    }
}

async function handlePaystackWebhook(req: Request) {
    try {
        const body = await req.text()

        // Verify Paystack signature
        const hash = crypto
            .createHmac("sha512", PAYSTACK_SECRET || "")
            .update(body)
            .digest("hex")

        const signature = req.headers.get("x-paystack-signature")

        if (hash !== signature) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
        }

        const event = JSON.parse(body)

        if (event.event === "charge.success") {
            const data = event.data
            const userId = data.metadata?.userId
            const tier = data.metadata?.tier

            if (userId && tier) {
                await updateUserSubscription(userId, tier, "paystack", data.reference)
            }
        }

        return NextResponse.json({ received: true })
    } catch (error: any) {
        console.error("Paystack webhook error:", error)
        return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
    }
}

async function updateUserSubscription(
    userId: string,
    tier: string,
    provider: string,
    externalId: string | null
) {
    // Update the user's subscription tier
    await prisma.user.update({
        where: { id: userId },
        data: { subscriptionTier: tier },
    })

    // Reset quotas when upgrading
    const quotaLimits: Record<string, { ai: number; mastering: number; lyrics: number }> = {
        BASIC: { ai: 5, mastering: 2, lyrics: 3 },
        PRO: { ai: 25, mastering: 10, lyrics: 15 },
        PREMIUM: { ai: 100, mastering: 50, lyrics: 50 },
    }

    const limits = quotaLimits[tier] || quotaLimits.BASIC

    await prisma.quota.upsert({
        where: { artistId: userId },
        update: {
            releasesUsed: 0,
            masteringUsed: 0,
            songCreationUsed: 0,
            coverCreationUsed: 0,
            lyricsUsed: 0,
            resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
        create: {
            artistId: userId,
            releasesUsed: 0,
            masteringUsed: 0,
            songCreationUsed: 0,
            coverCreationUsed: 0,
            lyricsUsed: 0,
            resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
    })

    // Log the subscription change
    await prisma.adminLog.create({
        data: {
            adminId: userId, // System-initiated, logged under user
            action: `SUBSCRIPTION_${tier === "BASIC" ? "CANCELLED" : "UPGRADED"}`,
            meta: JSON.stringify({ tier, provider, externalId }),
        },
    })
}
