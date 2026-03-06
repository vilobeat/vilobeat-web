import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY

// Tier pricing mapping
const TIER_PRICES: Record<string, { stripe: string; paystack_amount: number; name: string }> = {
    PRO: {
        stripe: "price_vilobeat_pro", // Replace with actual Stripe price ID
        paystack_amount: 2999 * 100, // $29.99 in kobo/cents
        name: "ViloBeat Pro",
    },
    PREMIUM: {
        stripe: "price_vilobeat_premium", // Replace with actual Stripe price ID
        paystack_amount: 5999 * 100, // $59.99 in kobo/cents
        name: "ViloBeat Premium",
    },
}

export async function POST(req: Request) {
    const session = await auth()

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { tier, provider } = await req.json()

    if (!tier || !TIER_PRICES[tier]) {
        return NextResponse.json({ error: "Invalid subscription tier" }, { status: 400 })
    }

    if (!provider || !["stripe", "paystack"].includes(provider)) {
        return NextResponse.json({ error: "Invalid payment provider. Use 'stripe' or 'paystack'" }, { status: 400 })
    }

    const tierInfo = TIER_PRICES[tier]
    const user = await prisma.user.findUnique({ where: { id: session.user.id } })

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    try {
        if (provider === "stripe") {
            // Create Stripe Checkout Session
            const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${STRIPE_SECRET}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    "mode": "subscription",
                    "line_items[0][price]": tierInfo.stripe,
                    "line_items[0][quantity]": "1",
                    "success_url": `${process.env.NEXTAUTH_URL}/dashboard?payment=success`,
                    "cancel_url": `${process.env.NEXTAUTH_URL}/dashboard?payment=cancelled`,
                    "client_reference_id": session.user.id,
                    "customer_email": user.email,
                    "metadata[tier]": tier,
                    "metadata[userId]": session.user.id,
                }),
            })

            const stripeSession = await stripeRes.json()

            if (stripeSession.error) {
                return NextResponse.json({ error: stripeSession.error.message }, { status: 400 })
            }

            return NextResponse.json({
                provider: "stripe",
                checkoutUrl: stripeSession.url,
                sessionId: stripeSession.id,
            })

        } else {
            // Create Paystack Transaction
            const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${PAYSTACK_SECRET}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: user.email,
                    amount: tierInfo.paystack_amount,
                    currency: "NGN",
                    callback_url: `${process.env.NEXTAUTH_URL}/dashboard?payment=success`,
                    metadata: {
                        userId: session.user.id,
                        tier,
                        custom_fields: [
                            { display_name: "Plan", variable_name: "plan", value: tierInfo.name },
                        ],
                    },
                }),
            })

            const paystackData = await paystackRes.json()

            if (!paystackData.status) {
                return NextResponse.json({ error: paystackData.message }, { status: 400 })
            }

            return NextResponse.json({
                provider: "paystack",
                checkoutUrl: paystackData.data.authorization_url,
                reference: paystackData.data.reference,
            })
        }
    } catch (error: any) {
        console.error("Payment checkout error:", error)
        return NextResponse.json({ error: "Payment processing failed" }, { status: 500 })
    }
}
