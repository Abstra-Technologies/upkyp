import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
} from "@aws-sdk/client-s3";

export const s3 = new S3Client({
    region: process.env.NEXT_AWS_REGION!,
    credentials: {
        accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
    },
});


export async function deleteFromS3(fileUrl: string) {
    const bucket = process.env.NEXT_S3_BUCKET_NAME!;

    const key = decodeURIComponent(
        new URL(fileUrl).pathname.replace(/^\/+/, "")
    );

    await s3.send(
        new DeleteObjectCommand({
            Bucket: bucket,
            Key: key,
        })
    );

    console.log("✅ S3 deleted:", key);
}

export async function uploadToS3(
    buffer: Buffer,
    key: string,
    contentType: string
) {
    const bucket = process.env.NEXT_S3_BUCKET_NAME!;

    await s3.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType,
        })
    );

    return `https://${bucket}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${key}`;
}

export const deleteS3Object = async (url: string) => {
    if (!url) return;

    try {
        const parsed = new URL(url);
        const Key = decodeURIComponent(parsed.pathname.substring(1));

        await s3.send(
            new DeleteObjectCommand({
                Bucket: process.env.NEXT_S3_BUCKET_NAME!,
                Key,
            })
        );
    } catch (err) {
        console.error("❌ Failed to delete S3 object:", url, err);
        throw err;
    }
};

export async function uploadDocumentToS3(
    buffer: Buffer,
    landlordId: string,
    referenceType: string,
    referenceId: string,
    fileName: string,
    contentType: string
): Promise<string> {
    const bucket = process.env.NEXT_S3_BUCKET_NAME!;
    const ext = fileName.split(".").pop() || "bin";
    
    const key = `documents/${landlordId}/${referenceType}/${referenceId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

    await s3.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType,
        })
    );

    return `https://${bucket}.s3.${process.env.NEXT_AWS_REGION}.amazonaws.com/${key}`;
}

export async function deleteDocumentFromS3(fileUrl: string) {
    if (!fileUrl) return;
    
    const bucket = process.env.NEXT_S3_BUCKET_NAME!;

    try {
        const key = decodeURIComponent(
            new URL(fileUrl).pathname.replace(/^\/+/, "")
        );

        await s3.send(
            new DeleteObjectCommand({
                Bucket: bucket,
                Key: key,
            })
        );

        console.log("✅ Document deleted from S3:", key);
    } catch (err) {
        console.error("❌ Failed to delete document from S3:", fileUrl, err);
    }
}