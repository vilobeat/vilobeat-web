// ────────────────────────────────────────────────────────
// ViloBeat Subscription Tier Configuration
// ────────────────────────────────────────────────────────
import prisma from "./prisma";
// ────────────────────────────────────────────────────────

export interface TierConfig {
    name: string
    price: number
    color: string
    releases: number        // -1 = unlimited
    mastering: number
    songCreation: number
    coverCreation: number
    audioSeparator: number
    voiceReference: number
    lyricsToMusic: number
    lyricsAccess: number    // -1 = unlimited
    processingDays: string  // e.g. "3–5 Days"
    dspUnlockMonths: number
    dspUnlockFee: number    // 0 = free
}

export const TIER_CONFIG: Record<string, TierConfig> = {
    BASIC: {
        name: "Basic",
        price: 15,
        color: "#22C55E",      // Green
        releases: 3,
        mastering: 3,
        songCreation: 3,
        coverCreation: 3,
        audioSeparator: 3,
        voiceReference: 3,
        lyricsToMusic: 3,
        lyricsAccess: 5,       // Limited
        processingDays: "3-5 Business days",
        dspUnlockMonths: 12,
        dspUnlockFee: 100,
    },
    PRO: {
        name: "Pro",
        price: 25,
        color: "#3B82F6",      // Blue
        releases: 6,
        mastering: 6,
        songCreation: 6,
        coverCreation: 6,
        audioSeparator: 6,
        voiceReference: 6,
        lyricsToMusic: 6,
        lyricsAccess: 15,      // Extended
        processingDays: "2-5 Business days",
        dspUnlockMonths: 9,
        dspUnlockFee: 75,
    },
    ELITE: {
        name: "Elite",
        price: 42,
        color: "#A855F7",      // Purple
        releases: 13,
        mastering: 13,
        songCreation: 13,
        coverCreation: 13,
        audioSeparator: 13,
        voiceReference: 13,
        lyricsToMusic: 13,
        lyricsAccess: -1,      // Full
        processingDays: "1-5 Business days",
        dspUnlockMonths: 6,
        dspUnlockFee: 30,
    },
    EXPERT: {
        name: "Expert",
        price: 80,
        color: "#EF4444",      // Red
        releases: -1,          // Unlimited
        mastering: -1,
        songCreation: -1,
        coverCreation: -1,
        audioSeparator: -1,
        voiceReference: -1,
        lyricsToMusic: -1,
        lyricsAccess: -1,      // Full
        processingDays: "1-2 Business days",
        dspUnlockMonths: 6,
        dspUnlockFee: 0,       // FREE
    },
}

// Map quota field names to tier config keys
export const QUOTA_FIELD_MAP: Record<string, keyof TierConfig> = {
    releasesUsed: "releases",
    masteringUsed: "mastering",
    songCreationUsed: "songCreation",
    coverCreationUsed: "coverCreation",
    audioSeparatorUsed: "audioSeparator",
    voiceReferenceUsed: "voiceReference",
    lyricsToMusicUsed: "lyricsToMusic",
    lyricsUsed: "lyricsAccess",
}

/**
 * Check if a user has remaining quota for a given action.
 * Returns { allowed, used, limit, remaining }
 */
export function checkQuota(
    tier: string,
    quotaField: keyof typeof QUOTA_FIELD_MAP,
    currentUsed: number
): { allowed: boolean; used: number; limit: number; remaining: number } {
    const config = TIER_CONFIG[tier] || TIER_CONFIG.BASIC
    const limitKey = QUOTA_FIELD_MAP[quotaField]
    const limit = config[limitKey] as number

    if (limit === -1) {
        return { allowed: true, used: currentUsed, limit: -1, remaining: -1 }
    }

    const remaining = limit - currentUsed
    return {
        allowed: remaining > 0,
        used: currentUsed,
        limit,
        remaining: Math.max(0, remaining),
    }
}

/**
 * Get DSP unlock status for a user.
 */
export function getDspUnlockStatus(
    tier: string,
    subscriptionStartDate: Date | null,
    dspUnlocked: boolean
): {
    unlocked: boolean
    monthsRequired: number
    monthsElapsed: number
    monthsRemaining: number
    unlockFee: number
    eligibleForUnlock: boolean
} {
    const config = TIER_CONFIG[tier] || TIER_CONFIG.BASIC

    if (dspUnlocked) {
        return {
            unlocked: true,
            monthsRequired: config.dspUnlockMonths,
            monthsElapsed: config.dspUnlockMonths,
            monthsRemaining: 0,
            unlockFee: config.dspUnlockFee,
            eligibleForUnlock: false,
        }
    }

    if (!subscriptionStartDate) {
        return {
            unlocked: false,
            monthsRequired: config.dspUnlockMonths,
            monthsElapsed: 0,
            monthsRemaining: config.dspUnlockMonths,
            unlockFee: config.dspUnlockFee,
            eligibleForUnlock: false,
        }
    }

    const now = new Date()
    const diffMs = now.getTime() - subscriptionStartDate.getTime()
    const monthsElapsed = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30))
    const monthsRemaining = Math.max(0, config.dspUnlockMonths - monthsElapsed)

    return {
        unlocked: false,
        monthsRequired: config.dspUnlockMonths,
        monthsElapsed,
        monthsRemaining,
        unlockFee: config.dspUnlockFee,
        eligibleForUnlock: monthsRemaining === 0,
    }
}

/**
 * Get full quota usage for a user's tier.
 */
export function getQuotaUsage(
    tier: string,
    quota: any | null
) {
    const config = TIER_CONFIG[tier] || TIER_CONFIG.BASIC

    return {
        releases: { used: quota?.releasesUsed || 0, limit: config.releases },
        mastering: { used: quota?.masteringUsed || 0, limit: config.mastering },
        songCreation: { used: quota?.songCreationUsed || 0, limit: config.songCreation },
        coverCreation: { used: quota?.coverCreationUsed || 0, limit: config.coverCreation },
        audioSeparator: { used: quota?.audioSeparatorUsed || 0, limit: config.audioSeparator },
        voiceReference: { used: quota?.voiceReferenceUsed || 0, limit: config.voiceReference },
        lyricsToMusic: { used: quota?.lyricsToMusicUsed || 0, limit: config.lyricsToMusic },
        lyrics: { used: quota?.lyricsUsed || 0, limit: config.lyricsAccess },
    }
}

/**
 * Enforce and increment a user's quota.
 * Used by API routes to check bounds and deduct standard usage.
 */
export async function enforceAndIncrementQuota(userId: string, quotaField: keyof typeof QUOTA_FIELD_MAP) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { quota: true }
    })

    if (!user) return { allowed: false, message: "User not found" }

    let quota = user.quota
    if (!quota) {
        quota = await prisma.quota.create({
            data: {
                artistId: userId,
                resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        })
    }

    const currentUsed = (quota as any)[quotaField]
    const check = checkQuota(user.subscriptionTier, quotaField, currentUsed)

    if (!check.allowed) {
        const readableLimit = quotaField.replace('Used', '')
        return { allowed: false, message: `Monthly ${readableLimit} limit reached for ${user.subscriptionTier} tier.` }
    }

    if (check.limit !== -1) {
        await prisma.quota.update({
            where: { id: quota.id },
            data: { [quotaField]: { increment: 1 } }
        })
    }

    return { allowed: true }
}
