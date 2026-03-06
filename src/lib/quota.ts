import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { checkQuota, QUOTA_FIELD_MAP } from "@/lib/subscriptions"

type QuotaAction = keyof typeof QUOTA_FIELD_MAP

/**
 * Middleware that checks if a user has remaining quota for a given action.
 * Returns { allowed: true, quota } or a 403 response.
 */
export async function requireQuota(userId: string, tier: string, action: QuotaAction) {
    // Ensure quota record exists
    let quota = await prisma.quota.findUnique({ where: { artistId: userId } })

    if (!quota) {
        const nextMonth = new Date()
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        nextMonth.setDate(1)
        nextMonth.setHours(0, 0, 0, 0)

        quota = await prisma.quota.create({
            data: {
                artistId: userId,
                resetDate: nextMonth,
            },
        })
    }

    // Check if monthly reset is needed
    if (new Date() >= quota.resetDate) {
        const nextMonth = new Date()
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        nextMonth.setDate(1)
        nextMonth.setHours(0, 0, 0, 0)

        quota = await prisma.quota.update({
            where: { id: quota.id },
            data: {
                releasesUsed: 0,
                masteringUsed: 0,
                songCreationUsed: 0,
                coverCreationUsed: 0,
                lyricsUsed: 0,
                resetDate: nextMonth,
            },
        })
    }

    const currentUsed = (quota as any)[action] as number
    const result = checkQuota(tier, action, currentUsed)

    if (!result.allowed) {
        return {
            allowed: false as const,
            response: NextResponse.json(
                {
                    error: "Quota exceeded",
                    detail: `You've used ${result.used}/${result.limit} for this action. Manage your plan for more.`,
                    used: result.used,
                    limit: result.limit,
                },
                { status: 403 }
            ),
        }
    }

    return { allowed: true as const, quota }
}

/**
 * Increment a quota counter after a successful action.
 */
export async function incrementQuota(quotaId: string, action: QuotaAction) {
    const data: Record<string, { increment: number }> = {}
    data[action] = { increment: 1 }

    return prisma.quota.update({
        where: { id: quotaId },
        data,
    })
}
