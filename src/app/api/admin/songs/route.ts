import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user || !["SUPER_ADMIN", "SUPPORT_STAFF"].includes(session.user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const songs = await prisma.song.findMany({
            include: {
                artist: { select: { artistName: true, email: true } },
                royaltySplits: true,
                // The schema mapping says this should be fetched from RoyaltyLedger manually or defined in schema.
                // Looking at schema, `RoyaltyLedger` has `songId` but `Song` has NO back-relation `royaltyLedger`.
                // For now, I will not include royalties in this query, and fetch them manually.
            },
            orderBy: { createdAt: 'desc' }
        });

        // Compute total revenue per song immediately
        // Fetch royaltyLedgers for these songs
        const songIds = songs.map(s => s.id);
        const ledgers = await prisma.royaltyLedger.findMany({
            where: { songId: { in: songIds } },
            select: { songId: true, amount: true }
        });

        const enhancedSongs = songs.map(song => {
            const songLedgers = ledgers.filter(l => l.songId === song.id);
            return {
                ...song,
                totalRevenue: songLedgers.reduce((sum, r) => sum + r.amount, 0)
            };
        });

        return NextResponse.json({ songs: enhancedSongs });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
