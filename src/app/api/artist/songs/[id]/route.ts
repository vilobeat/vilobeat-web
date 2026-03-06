import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import prisma from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession(req)
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session as any).user?.id || (session as any).id
    const { id: songId } = await params;

    if (!songId) {
        return NextResponse.json({ error: "Song ID required" }, { status: 400 })
    }

    try {
        const song = await prisma.song.findUnique({
            where: {
                id: songId,
                artistId: userId // Ensure they own it
            },
            include: {
                analytics: true
            }
        });

        if (!song) {
            return NextResponse.json({ error: "Song not found" }, { status: 404 })
        }

        // Fetch ledgers manually
        const royaltyLedgers = await prisma.royaltyLedger.findMany({
            where: { songId: song.id }
        });

        // Merge back into response object
        const finalSong = { ...song, royaltyLedger: royaltyLedgers };

        return NextResponse.json(finalSong)
    } catch (e) {
        console.error('Error fetching song details:', e)
        return NextResponse.json({ error: "Failed to fetch song details" }, { status: 500 })
    }
}
