import { PrismaClient } from "@prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import path from "path"

const dbPath = path.resolve(process.cwd(), "dev.db")
const adapter = new PrismaBetterSqlite3({ url: dbPath })
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log("🌱 Seeding ViloBeat database...")

    // Clean existing data (order matters for foreign keys)
    await prisma.taskHistory.deleteMany()
    await prisma.adminLog.deleteMany()
    await prisma.withdrawalRequest.deleteMany()
    await prisma.royaltySplit.deleteMany()
    await prisma.coverArt.deleteMany()
    await prisma.lyrics.deleteMany()
    await prisma.analytics.deleteMany()
    await prisma.royaltyLedger.deleteMany()
    await prisma.task.deleteMany()
    await prisma.quota.deleteMany()
    await prisma.song.deleteMany()
    await prisma.user.deleteMany()

    // ─── USERS ────────────────────────────────────────
    const admin = await prisma.user.create({
        data: {
            email: "admin@vilobeat.com",
            passwordHash: "admin123",
            role: "SUPER_ADMIN",
            subscriptionTier: "EXPERT",
            artistName: "Admin",
        },
    })

    const distManager = await prisma.user.create({
        data: {
            email: "dist@vilobeat.com",
            passwordHash: "staff123",
            role: "DISTRIBUTION_MANAGER",
            artistName: "Distribution Manager",
        },
    })

    const creativeManager = await prisma.user.create({
        data: {
            email: "creative@vilobeat.com",
            passwordHash: "staff123",
            role: "CREATIVE_MANAGER",
            artistName: "Creative Manager",
        },
    })

    const financeAdmin = await prisma.user.create({
        data: {
            email: "finance@vilobeat.com",
            passwordHash: "staff123",
            role: "FINANCE_ADMIN",
            artistName: "Finance Admin",
        },
    })

    const support = await prisma.user.create({
        data: {
            email: "support@vilobeat.com",
            passwordHash: "staff123",
            role: "SUPPORT_STAFF",
            artistName: "Support Staff",
        },
    })

    // Artists with different tiers
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const artist1 = await prisma.user.create({
        data: {
            email: "johan@music.com",
            passwordHash: "artist123",
            role: "ARTIST",
            subscriptionTier: "PRO",
            subscriptionStartDate: sixMonthsAgo,
            artistName: "Johan Beats",
            bio: "Afrobeats producer and vocalist",
            genre: "Afrobeats",
            phone: "+234812345678",
            walletBalance: 467.50,
            socialLinks: JSON.stringify({ instagram: "@johanbeats", tiktok: "@johanmusic" }),
        },
    })

    const artist2 = await prisma.user.create({
        data: {
            email: "synthwave@beats.com",
            passwordHash: "artist123",
            role: "ARTIST",
            subscriptionTier: "ELITE",
            subscriptionStartDate: threeMonthsAgo,
            artistName: "SynthWave",
            bio: "Electronic music artist and producer",
            genre: "Electronic",
            walletBalance: 896.30,
            socialLinks: JSON.stringify({ spotify: "SynthWaveOfficial" }),
        },
    })

    const artist3 = await prisma.user.create({
        data: {
            email: "lillyrose@email.com",
            passwordHash: "artist123",
            role: "ARTIST",
            subscriptionTier: "BASIC",
            subscriptionStartDate: threeMonthsAgo,
            artistName: "Lilly Rose",
            bio: "Singer-songwriter from Lagos",
            genre: "Pop",
            walletBalance: 45.60,
        },
    })
    console.log("  ✅ Users created (5 staff + 3 artists)")

    // ─── SONGS ────────────────────────────────────────
    const song1 = await prisma.song.create({
        data: {
            artistId: artist1.id,
            title: "Electric Soul",
            artistName: "Johan Beats",
            genre: "Afrobeats",
            subgenre: "Afro-pop",
            audioUrl: "/uploads/electric-soul.mp3",
            coverUrl: "/covers/electric-soul.jpg",
            status: "LIVE",
            releaseDate: new Date("2026-01-15"),
            labelName: "ViloBeat Records",
            producer: "Johan Beats",
            isrc: "VB2026001",
            shareLink: "https://open.spotify.com/track/example1",
        },
    })

    const song2 = await prisma.song.create({
        data: {
            artistId: artist1.id,
            title: "Midnight Vibes",
            artistName: "Johan Beats",
            genre: "Afrobeats",
            audioUrl: "/uploads/midnight-vibes.mp3",
            status: "LIVE",
            releaseDate: new Date("2026-02-01"),
            producer: "Johan Beats",
            isrc: "VB2026002",
        },
    })

    const song3 = await prisma.song.create({
        data: {
            artistId: artist2.id,
            title: "Retrograde",
            artistName: "SynthWave",
            genre: "Electronic",
            subgenre: "Synthwave",
            audioUrl: "/uploads/retrograde.mp3",
            coverUrl: "/covers/retrograde.jpg",
            status: "LIVE",
            releaseDate: new Date("2026-02-10"),
            producer: "SynthWave",
            isrc: "VB2026003",
        },
    })

    const song4 = await prisma.song.create({
        data: {
            artistId: artist3.id,
            title: "Rose Garden",
            artistName: "Lilly Rose",
            genre: "Pop",
            audioUrl: "/uploads/rose-garden.mp3",
            status: "PROCESSING",
        },
    })

    const song5 = await prisma.song.create({
        data: {
            artistId: artist2.id,
            title: "Neon Dreams",
            artistName: "SynthWave",
            genre: "Electronic",
            audioUrl: "/uploads/neon-dreams.mp3",
            status: "PENDING_REVIEW",
        },
    })
    console.log("  ✅ Songs created")

    // ─── ROYALTY SPLITS ───────────────────────────────
    await prisma.royaltySplit.createMany({
        data: [
            { songId: song1.id, name: "Johan Beats", email: "johan@music.com", percentage: 80, userId: artist1.id },
            { songId: song1.id, name: "DJ Mix", email: "djmix@example.com", percentage: 20 },
            { songId: song2.id, name: "Johan Beats", email: "johan@music.com", percentage: 100, userId: artist1.id },
            { songId: song3.id, name: "SynthWave", email: "synthwave@beats.com", percentage: 100, userId: artist2.id },
        ],
    })
    console.log("  ✅ Royalty splits created")

    // ─── TASKS ────────────────────────────────────────
    const task1 = await prisma.task.create({
        data: {
            type: "DISTRIBUTION",
            status: "PENDING",
            songId: song5.id,
            requestedById: artist2.id,
            estimatedCompletionDate: new Date(Date.now() + 5 * 86400000),
        },
    })

    const task2 = await prisma.task.create({
        data: {
            type: "DISTRIBUTION",
            status: "COMPLETED",
            songId: song2.id,
            requestedById: artist1.id,
            assignedToId: distManager.id,
        },
    })

    const task3 = await prisma.task.create({
        data: {
            type: "DISTRIBUTION",
            status: "IN_PROGRESS",
            songId: song4.id,
            requestedById: artist3.id,
            assignedToId: distManager.id,
            estimatedCompletionDate: new Date(Date.now() + 3 * 86400000),
        },
    })

    const task4 = await prisma.task.create({
        data: {
            type: "MASTERING",
            status: "PENDING",
            songId: song3.id,
            requestedById: artist2.id,
            meta: JSON.stringify({ notes: "Boost bass, warm mastering" }),
        },
    })

    await prisma.task.create({
        data: {
            type: "MASTERING",
            status: "IN_PROGRESS",
            songId: song1.id,
            requestedById: artist1.id,
            assignedToId: creativeManager.id,
            estimatedCompletionDate: new Date(Date.now() + 2 * 86400000),
        },
    })

    await prisma.task.create({
        data: {
            type: "COVER_CREATION",
            status: "COMPLETED",
            songId: song1.id,
            requestedById: artist1.id,
            assignedToId: creativeManager.id,
            downloadUrl: "/covers/electric-soul.jpg",
        },
    })

    await prisma.task.create({
        data: {
            type: "LYRICS_CREATION",
            status: "COMPLETED",
            requestedById: artist2.id,
            meta: JSON.stringify({ mood: "energetic", genre: "Electronic" }),
        },
    })

    await prisma.task.create({
        data: {
            type: "LYRICS_TO_MUSIC",
            status: "IN_PROGRESS",
            requestedById: artist1.id,
            assignedToId: creativeManager.id,
            meta: JSON.stringify({ lyrics: "Sample lyrics...", genre: "Afrobeats", vocalType: "Male" }),
            estimatedCompletionDate: new Date(Date.now() + 4 * 86400000),
        },
    })
    console.log("  ✅ Tasks created")

    // ─── TASK HISTORY ─────────────────────────────────
    await prisma.taskHistory.createMany({
        data: [
            { taskId: task2.id, action: "STATUS_CHANGE", oldValue: "PENDING", newValue: "IN_PROGRESS", changedBy: distManager.id },
            { taskId: task2.id, action: "STATUS_CHANGE", oldValue: "IN_PROGRESS", newValue: "COMPLETED", changedBy: distManager.id },
            { taskId: task3.id, action: "ASSIGNED", newValue: distManager.id, changedBy: admin.id },
            { taskId: task3.id, action: "STATUS_CHANGE", oldValue: "PENDING", newValue: "IN_PROGRESS", changedBy: distManager.id },
        ],
    })
    console.log("  ✅ Task history created")

    // ─── ROYALTY ENTRIES ──────────────────────────────
    await prisma.royaltyLedger.createMany({
        data: [
            { artistId: artist1.id, amount: 245.50, description: "Spotify streams - Jan 2026", platform: "Spotify", songId: song1.id },
            { artistId: artist1.id, amount: 132.80, description: "Apple Music streams - Jan 2026", platform: "Apple Music", songId: song1.id },
            { artistId: artist1.id, amount: 89.20, description: "YouTube Music - Jan 2026", platform: "YouTube Music", songId: song2.id },
            { artistId: artist2.id, amount: 567.90, description: "Spotify streams - Jan 2026", platform: "Spotify", songId: song3.id },
            { artistId: artist2.id, amount: 328.40, description: "Apple Music streams - Jan 2026", platform: "Apple Music", songId: song3.id },
            { artistId: artist3.id, amount: 45.60, description: "Spotify streams - Feb 2026", platform: "Spotify" },
            { artistId: artist1.id, amount: 310.00, description: "Spotify streams - Feb 2026", platform: "Spotify" },
            { artistId: artist2.id, amount: 420.15, description: "Spotify streams - Feb 2026", platform: "Spotify" },
        ],
    })
    console.log("  ✅ Royalty entries created")

    // ─── ANALYTICS ────────────────────────────────────
    await prisma.analytics.createMany({
        data: [
            {
                artistId: artist1.id,
                songId: song1.id,
                totalStreams: 15420,
                monthlyStreams: JSON.stringify({ "2026-01": 8200, "2026-02": 7220 }),
                platformBreakdown: JSON.stringify({ spotify: 9800, apple: 3200, youtube: 1500, boomplay: 920 }),
                dspLinks: JSON.stringify({ spotify: "https://open.spotify.com/track/example1", apple: "https://music.apple.com/example1" }),
            },
            {
                artistId: artist1.id,
                songId: song2.id,
                totalStreams: 8900,
                monthlyStreams: JSON.stringify({ "2026-02": 8900 }),
                platformBreakdown: JSON.stringify({ spotify: 5200, apple: 2100, youtube: 1600 }),
            },
            {
                artistId: artist2.id,
                songId: song3.id,
                totalStreams: 22100,
                monthlyStreams: JSON.stringify({ "2026-02": 12100, "2026-03": 10000 }),
                platformBreakdown: JSON.stringify({ spotify: 14500, apple: 4200, youtube: 3400 }),
                dspLinks: JSON.stringify({ spotify: "https://open.spotify.com/track/example3" }),
            },
        ],
    })
    console.log("  ✅ Analytics created")

    // ─── QUOTAS ───────────────────────────────────────
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    nextMonth.setDate(1)

    await prisma.quota.createMany({
        data: [
            { artistId: artist1.id, releasesUsed: 2, masteringUsed: 1, songCreationUsed: 0, coverCreationUsed: 1, lyricsUsed: 3, resetDate: nextMonth },
            { artistId: artist2.id, releasesUsed: 3, masteringUsed: 1, songCreationUsed: 1, coverCreationUsed: 0, lyricsUsed: 2, resetDate: nextMonth },
            { artistId: artist3.id, releasesUsed: 1, masteringUsed: 0, songCreationUsed: 0, coverCreationUsed: 0, lyricsUsed: 1, resetDate: nextMonth },
        ],
    })
    console.log("  ✅ Quotas created")

    // ─── LYRICS ───────────────────────────────────────
    await prisma.lyrics.createMany({
        data: [
            { userId: artist1.id, content: "Dancing in the moonlight\nFeel the rhythm of the night\nHeartbeat syncing with the bass...", mood: "Energetic", theme: "Party", genre: "Afrobeats", tempo: "Fast" },
            { userId: artist2.id, content: "Neon lights reflecting\nIn the rain-soaked street\nSynthesizers humming...", mood: "Melancholic", theme: "Night Life", genre: "Electronic", tempo: "Medium" },
        ],
    })
    console.log("  ✅ Lyrics created")

    // ─── WITHDRAWAL REQUESTS ──────────────────────────
    await prisma.withdrawalRequest.create({
        data: {
            artistId: artist1.id,
            amount: 200.00,
            status: "APPROVED",
            processedById: admin.id,
            processedAt: new Date(Date.now() - 86400000 * 5),
        },
    })
    await prisma.withdrawalRequest.create({
        data: {
            artistId: artist2.id,
            amount: 500.00,
            status: "PENDING",
        },
    })
    console.log("  ✅ Withdrawal requests created")

    // ─── ADMIN LOGS ───────────────────────────────────
    await prisma.adminLog.createMany({
        data: [
            { adminId: admin.id, action: "USER_CREATED", targetType: "USER", meta: JSON.stringify({ email: "johan@music.com" }) },
            { adminId: distManager.id, action: "TASK_STATUS_CHANGE", targetId: task2.id, targetType: "TASK", meta: JSON.stringify({ from: "PENDING", to: "COMPLETED" }) },
            { adminId: admin.id, action: "WITHDRAWAL_APPROVED", targetType: "WITHDRAWAL", meta: JSON.stringify({ artist: "johan@music.com", amount: 200 }) },
            { adminId: admin.id, action: "ROYALTY_ADDED", targetType: "ROYALTY", meta: JSON.stringify({ artist: "synthwave@beats.com", amount: 567.90 }) },
            { adminId: creativeManager.id, action: "TASK_ASSIGNED", targetId: task3.id, targetType: "TASK", meta: JSON.stringify({ assignee: "dist@vilobeat.com" }) },
        ],
    })
    console.log("  ✅ Admin logs created")

    console.log("\n🎉 Seeding complete!\n")
    console.log("Test accounts:")
    console.log("  Admin:           admin@vilobeat.com / admin123")
    console.log("  Dist Manager:    dist@vilobeat.com / staff123")
    console.log("  Creative Mgr:    creative@vilobeat.com / staff123")
    console.log("  Finance Admin:   finance@vilobeat.com / staff123")
    console.log("  Artist (PRO):    johan@music.com / artist123")
    console.log("  Artist (ELITE):  synthwave@beats.com / artist123")
    console.log("  Artist (BASIC):  lillyrose@email.com / artist123")
}

main()
    .catch((e) => {
        console.error("Seed error:", e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
