import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
    const session = await auth()

    if (!session?.user || session.user.role === "ARTIST") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""

    const whereClause: any = {}
    if (search) {
        whereClause.artist = {
            email: { contains: search },
        }
    }

    const royalties = await prisma.royaltyLedger.findMany({
        where: whereClause,
        include: {
            artist: {
                select: { email: true, subscriptionTier: true },
            },
        },
        orderBy: { date: "desc" },
    })

    // Aggregate totals
    const total = await prisma.royaltyLedger.aggregate({
        _sum: { amount: true },
        _count: true,
    })

    return NextResponse.json({
        royalties,
        totalAmount: total._sum.amount || 0,
        totalEntries: total._count,
    })
}
