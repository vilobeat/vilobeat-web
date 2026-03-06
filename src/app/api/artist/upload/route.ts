import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import prisma from "@/lib/prisma"
import { enforceAndIncrementQuota } from "@/lib/subscriptions"

export async function POST(req: Request) {
    const session = await getSession(req)

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const data = await req.json()
        const {
            title, artistName, featuredArtists, genre, subgenre, releaseDate, explicit,
            audioUrl, coverUrl, isrc, labelName, producer, composer,
            audioSource, coverSource, masteringTaskId, lyricsToMusicTaskId,
            royaltySplits
        } = data

        if (!title || !audioUrl) {
            return NextResponse.json({ error: "Title and Audio URL are required" }, { status: 400 })
        }

        // Validate royalty splits if provided
        if (royaltySplits && royaltySplits.length > 0) {
            const totalPercentage = royaltySplits.reduce((sum: number, split: any) => sum + Number(split.percentage), 0)
            // Precise float comparison
            if (Math.abs(totalPercentage - 100.0) > 0.01) {
                return NextResponse.json({ error: "Royalty splits must equal exactly 100%" }, { status: 400 })
            }
        }

        const quotaCheck = await enforceAndIncrementQuota(session.user.id, "releasesUsed");
        if (!quotaCheck.allowed) {
            return NextResponse.json({ error: quotaCheck.message }, { status: 403 });
        }

        const song = await prisma.song.create({
            data: {
                artistId: session.user.id,
                title,
                artistName,
                featuredArtists,
                genre: genre || null,
                subgenre,
                releaseDate: releaseDate ? new Date(releaseDate) : null,
                explicit: explicit || false,
                audioUrl,
                coverUrl: coverUrl || null,
                isrc,
                labelName,
                producer,
                composer,
                audioSource: audioSource || "UPLOAD",
                masteringTaskId,
                lyricsToMusicTaskId,
                status: "PENDING_REVIEW", // Used to be UNDER_REVIEW

                // Nested create royalty splits
                royaltySplits: royaltySplits?.length > 0 ? {
                    create: royaltySplits.map((split: any) => ({
                        name: split.name,
                        email: split.email,
                        percentage: Number(split.percentage)
                    }))
                } : undefined,

                // Track cover art source if generated via Distribute Flow
                coverArts: (coverUrl && coverSource) ? {
                    create: {
                        userId: session.user.id,
                        imageUrl: coverUrl,
                        source: coverSource // UPLOAD, GENERATED, DISTRIBUTE_FLOW
                    }
                } : undefined
            }
        })

        const task = await prisma.task.create({
            data: {
                type: "DISTRIBUTION",
                requestedById: session.user.id,
                songId: song.id,
                status: "PENDING"
            }
        })

        return NextResponse.json({ song, task })

    } catch (e: any) {
        console.error("Distribution submit error:", e)
        return NextResponse.json({ error: e.message || "Failed to submit distribution" }, { status: 500 })
    }
}
