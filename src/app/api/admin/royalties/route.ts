import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
    const session = await auth()

    if (!session?.user || !["SUPER_ADMIN", "SUPPORT_STAFF"].includes(session.user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { artistId, amount, description } = await req.json()

    if (!artistId || amount === undefined) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create Royalty Entry
    const royalty = await prisma.royaltyLedger.create({
        data: {
            artistId,
            amount,
            description
        }
    })

    // Update overall analytics for the artist (optional based on rules)
    // ...

    // Log action
    await prisma.adminLog.create({
        data: {
            adminId: session.user.id,
            action: `ADDED_ROYALTY`,
            meta: JSON.stringify({ artistId, amount })
        }
    })

    return NextResponse.json({ royalty })
}
