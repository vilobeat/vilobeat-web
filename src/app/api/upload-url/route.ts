import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
});

export async function POST(req: Request) {
    const session = await getSession(req);

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { filename, contentType } = await req.json();

        if (!filename || !contentType) {
            return NextResponse.json({ error: "Filename and contentType are required" }, { status: 400 });
        }

        const ext = filename.split('.').pop() || '';
        const uniqueFilename = `${session.user.id}/${crypto.randomBytes(16).toString('hex')}.${ext}`;

        const bucketName = process.env.R2_BUCKET_NAME || "vilobeat-storage";

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: uniqueFilename,
            ContentType: contentType,
        });

        // Generate a presigned URL valid for 1 hour
        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        // The public URL to access the file later (assuming bucket is public or CDN is linked)
        // Ideally this should use a custom domain, but for now we format it via cloudflare domains or just leave it referencing the bucket
        const fileUrl = `https://pub-${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.dev/${uniqueFilename}`;

        return NextResponse.json({ uploadUrl, fileUrl, key: uniqueFilename });

    } catch (error: any) {
        console.error("Presigned URL generation error:", error);
        return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
    }
}
