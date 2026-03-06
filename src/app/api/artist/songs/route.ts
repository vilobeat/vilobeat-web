import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await getSession(req);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session as any).user?.id || (session as any).id;

    try {
        const songs = await prisma.song.findMany({
            where: { artistId: userId },
            orderBy: { createdAt: "desc" },
            include: {
                analytics: true
            }
        });

        // Compute aggregate metrics per song for the list view
        const songsWithStats = songs.map((song: any) => {
            const totalStreams = song.analytics?.reduce((sum: number, a: any) => sum + (a.totalStreams || 0), 0) || 0;

            return {
                id: song.id,
                title: song.title,
                genre: song.genre,
                status: song.status,
                createdAt: song.createdAt.toISOString(),
                releaseDate: song.releaseDate ? song.releaseDate.toISOString() : null,
                audioUrl: song.audioUrl,
                coverUrl: song.coverUrl,
                shareLink: song.id ? `vilobeat.com/release/${song.id}` : null,
                stats: {
                    streams: totalStreams,
                    saves: 0 // Defaulting to 0 since we removed this field from Prisma
                }
            };
        });

        return NextResponse.json({ songs: songsWithStats });
    } catch (e: any) {
        console.error("Failed to fetch songs:", e);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
