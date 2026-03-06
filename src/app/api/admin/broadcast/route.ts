import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Resend } from 'resend';
import { Expo } from 'expo-server-sdk';

const expo = new Expo();

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !['SUPER_ADMIN', 'SUPPORT_STAFF'].includes(session?.user?.role || '')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { title, message, targetAudience, type = 'SYSTEM', actionUrl, scheduledFor, channels = { inApp: true } } = body;

        if (!title || !message || !targetAudience) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const scheduledDate = scheduledFor ? new Date(scheduledFor) : new Date();

        // Determine target users based on audience
        let whereClause = {};

        if (targetAudience === 'ALL') {
            whereClause = {};
        } else if (['BASIC', 'PRO', 'ELITE', 'EXPERT'].includes(targetAudience)) {
            whereClause = { subscriptionTier: targetAudience };
        } else if (targetAudience === 'ADMIN_ONLY') {
            whereClause = { role: { in: ['SUPER_ADMIN', 'SUPPORT_STAFF', 'FINANCE_ADMIN', 'DISTRIBUTION_MANAGER'] } };
        } else if (targetAudience === 'ARTISTS_ONLY') {
            whereClause = { role: 'ARTIST' };
        }

        const targetUsers = await prisma.user.findMany({
            where: whereClause,
            select: { id: true, email: true, expoPushToken: true }
        });

        if (targetUsers.length === 0) {
            return NextResponse.json({ error: 'No users found for this audience' }, { status: 404 });
        }

        // 1. Log Broadcast History Master Record
        const usedChannels = [];
        if (channels.inApp) usedChannels.push('IN_APP');
        if (channels.email) usedChannels.push('EMAIL');
        if (channels.push) usedChannels.push('PUSH');

        const broadcastRow = await prisma.broadcast.create({
            data: {
                title,
                message,
                targetAudience,
                channels: JSON.stringify(usedChannels),
                status: scheduledFor ? 'SCHEDULED' : 'COMPLETED',
                scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
                sentByAdminId: session.user.id,
                notifiedCount: targetUsers.length
            }
        });

        if (channels.inApp) {
            const notificationsData = targetUsers.map((u: any) => ({
                userId: u.id,
                title,
                message,
                type,
                actionUrl: actionUrl || null,
                createdAt: scheduledDate
            }));

            await prisma.notification.createMany({
                data: notificationsData
            });
        }

        // 3. Log Admin Action
        await prisma.adminLog.create({
            data: {
                adminId: session.user.id,
                action: 'SENT_BROADCAST',
                targetType: 'BROADCAST',
                targetId: broadcastRow.id,
                meta: JSON.stringify({ title, audience: targetAudience, count: targetUsers.length, scheduled: !!scheduledFor })
            }
        });

        // 4. Send Emails via Resend if requested
        if (channels.email && targetUsers.length > 0) {
            // Because this is a development key, ensure we log it.
            // Note: In production you MUST verify a domain and use it here (e.g., 'hello@vilobeat.com')
            // Using onboarding@resend.dev as default sender for unverified domains.
            try {
                const emailBatch = targetUsers.map((u: any) => ({
                    from: 'ViloBeat <onboarding@resend.dev>',
                    to: [u.email],
                    subject: title,
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <h1 style="color: #333;">${title}</h1>
                            <p style="color: #555; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</p>
                            ${actionUrl ? `<a href="${actionUrl}" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">View Details</a>` : ''}
                            <hr style="margin-top: 40px; border: none; border-top: 1px solid #eaeaea;" />
                            <p style="font-size: 12px; color: #999;">You are receiving this email because you are a registered user of ViloBeat.</p>
                        </div>
                    `
                }));

                if (!process.env.RESEND_API_KEY) {
                    console.log('Skipping email send: RESEND_API_KEY is missing');
                } else {
                    const resend = new Resend(process.env.RESEND_API_KEY);
                    await resend.batch.send(emailBatch);
                    console.log(`Successfully dispatched ${emailBatch.length} emails through Resend.`);
                }
            } catch (emailErr) {
                console.error('Resend Dispatch Failed. Check API Key domains.', emailErr);
                // We do not fail the whole broadcast since other channels may have succeeded.
            }
        }

        // 5. Send Push Notifications via Expo
        if (channels.push && targetUsers.length > 0) {
            const pushUsers = targetUsers.filter((u: any) => u.expoPushToken && Expo.isExpoPushToken(u.expoPushToken));

            if (pushUsers.length > 0) {
                const messages = pushUsers.map((u: any) => ({
                    to: u.expoPushToken,
                    sound: 'default' as const,
                    title: title,
                    body: message,
                    data: { actionUrl, type }
                }));

                try {
                    const chunks = expo.chunkPushNotifications(messages);
                    // Dispatch chunks asynchronously
                    for (const chunk of chunks) {
                        await expo.sendPushNotificationsAsync(chunk);
                    }
                    console.log(`Successfully dispatched ${messages.length} push notifications.`);
                } catch (pushErr) {
                    console.error('Expo Push Dispatch Failed.', pushErr);
                    // Do not fail broadcast since other channels succeeded.
                }
            } else {
                console.log("Push notifications requested, but no valid target device tokens were found.");
            }
        }

        return NextResponse.json({
            message: 'Broadcast sent successfully',
            usersNotified: targetUsers.length
        }, { status: 200 });

    } catch (error: any) {
        console.error('Failed to send broadcast:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
