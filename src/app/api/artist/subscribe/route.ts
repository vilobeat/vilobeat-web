import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await getSession(req);

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { tier } = await req.json();

        if (!tier || !['BASIC', 'PRO', 'ELITE', 'EXPERT'].includes(tier)) {
            return NextResponse.json({ error: "Invalid subscription tier" }, { status: 400 });
        }

        const user = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                subscriptionTier: tier as any,
                // Optional: You could track usage limits here or reset counters
            },
        });

        return NextResponse.json({ success: true, tier: user.subscriptionTier });

    } catch (e: any) {
        console.error("Subscription update error:", e);
        return NextResponse.json({ error: e.message || "Failed to update subscription" }, { status: 500 });
    }
}
