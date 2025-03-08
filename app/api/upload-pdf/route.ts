import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  TextractClient,
  StartDocumentTextDetectionCommand,
  GetDocumentTextDetectionCommand,
} from "@aws-sdk/client-textract";
import { v4 as uuidv4 } from "uuid";

const BUCKET_NAME = "intersightai-db";
const REGION = process.env.AWS_REGION || "us-west-1";

// AWS S3 Client
const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// AWS Textract Client
const textractClient = new TextractClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// ✅ Upload file to S3 with Logging
const uploadToS3 = async (fileBuffer: Buffer, fileName: string) => {
  const fileKey = `uploads/${uuidv4()}-${fileName}`;
  console.log(`🟡 Uploading file to S3: ${fileKey}...`);

  const uploadParams = {
    Bucket: BUCKET_NAME,
    Key: fileKey,
    Body: fileBuffer,
    ContentType: "application/pdf",
  };

  await s3Client.send(new PutObjectCommand(uploadParams));
  console.log(`✅ File uploaded to S3: ${fileKey}`);

  return fileKey;
};

// ✅ Extract text using Textract with Optimized Polling
const extractTextFromPDF = async (fileKey: string) => {
  console.log(`🟡 Starting Textract job for file: ${fileKey}`);

  const startCommand = new StartDocumentTextDetectionCommand({
    DocumentLocation: { S3Object: { Bucket: BUCKET_NAME, Name: fileKey } },
  });

  const { JobId } = await textractClient.send(startCommand);
  if (!JobId) throw new Error("❌ Textract failed to start document analysis");

  console.log(`🔄 Textract Job ID: ${JobId}, polling for results...`);

  let extractedText = "";
  let isProcessing = true;
  let attempts = 0;
  const maxAttempts = 20; // Set a limit to prevent infinite loops
  const pollingInterval = 7000; // Increase polling interval (reduce API calls)

  while (isProcessing && attempts < maxAttempts) {
    attempts++;
    console.log(`🔍 Polling Textract Job (Attempt ${attempts})...`);
    await new Promise((resolve) => setTimeout(resolve, pollingInterval));

    const getResult = new GetDocumentTextDetectionCommand({ JobId });
    const response = await textractClient.send(getResult);

    if (response.JobStatus === "SUCCEEDED") {
      extractedText = (response.Blocks || [])
        .filter((block) => block.BlockType === "LINE" && block.Text)
        .map((block) => block.Text as string)
        .join(" ");

      isProcessing = false;
      console.log(`✅ Textract extraction complete: ${extractedText.length} characters extracted.`);
    } else if (response.JobStatus === "FAILED") {
      throw new Error("❌ Textract failed to process the document");
    }
  }

  if (attempts === maxAttempts) {
    throw new Error("⏳ Textract took too long to process. Aborting...");
  }

  return extractedText;
};

// ✅ Main API Handler with Step Logging
export async function POST(req: NextRequest) {
  console.log("📥 Received file upload request...");

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;

    if (!file || !title) {
      console.error("❌ Missing file or title.");
      return NextResponse.json({ error: "Missing file or title" }, { status: 400 });
    }

    console.log(`📄 Processing file: ${file.name} (${file.size / 1024} KB)`);

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // ✅ Upload to S3
    const fileKey = await uploadToS3(fileBuffer, file.name);

    // ✅ Extract text
    const extractedContent = await extractTextFromPDF(fileKey);

    // ✅ Construct Public S3 URL
    const fileUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${fileKey}`;
    console.log(`🔗 File accessible at: ${fileUrl}`);

    // ✅ Metadata
    const metadata = {
      source: fileUrl,
      content: extractedContent,
      metadata: {
        size: file.size,
        title,
        file_type: "pdf",
        confidentiality: "public",
      },
    };

    console.log("✅ Upload & Processing Complete. Returning response.");
    return NextResponse.json(metadata, { status: 200 });
  } catch (error) {
    console.error("🚨 Upload Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
