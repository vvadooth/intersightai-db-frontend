import { NextRequest, NextResponse } from "next/server"
import { S3Client, PutObjectCommand, ObjectCannedACL } from "@aws-sdk/client-s3"
import { TextractClient, StartDocumentTextDetectionCommand, GetDocumentTextDetectionCommand } from "@aws-sdk/client-textract"
import { v4 as uuidv4 } from "uuid"

// Load environment variables
const BUCKET_NAME = "intersightai-db"
const REGION = process.env.AWS_REGION || "us-west-1"

// AWS S3 Client
const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

// AWS Textract Client
const textractClient = new TextractClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

// Function to upload file to S3
const uploadToS3 = async (fileBuffer: Buffer, fileName: string) => {
    const fileKey = `uploads/${uuidv4()}-${fileName}`
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: fileBuffer,
      ContentType: "application/pdf",
    }
  
    await s3Client.send(new PutObjectCommand(uploadParams))
  
    // ✅ Wait 2 seconds to ensure file availability in S3
    await new Promise((resolve) => setTimeout(resolve, 2000))
  
    return fileKey // ✅ Return just the file key (not full URL)
  }
  
  

// Function to extract text using Amazon Textract
const extractTextFromPDF = async (fileKey: string) => {
    const startCommand = new StartDocumentTextDetectionCommand({
      DocumentLocation: { S3Object: { Bucket: BUCKET_NAME, Name: fileKey } },
    })
  
    const { JobId } = await textractClient.send(startCommand)
    if (!JobId) throw new Error("Textract failed to start document analysis")
  
    let extractedText: string = ""
    let isProcessing = true
  
    while (isProcessing) {
      await new Promise((resolve) => setTimeout(resolve, 5000)) // Wait 5 sec
      const getResult = new GetDocumentTextDetectionCommand({ JobId })
      const response = await textractClient.send(getResult)
  
      if (response.JobStatus === "SUCCEEDED") {
        extractedText = (response.Blocks || [])
          .filter((block) => block.BlockType === "LINE" && block.Text)
          .map((block) => block.Text as string)
          .join(" ")
        isProcessing = false
      } else if (response.JobStatus === "FAILED") {
        throw new Error("Textract failed to process the document")
      }
    }
  
    return extractedText
  }
  

// Named export for POST request (Next.js App Router API)
export async function POST(req: NextRequest) {
    try {
      const formData = await req.formData()
      const file = formData.get("file") as File | null
      const title = formData.get("title") as string | null
  
      if (!file || !title) {
        return NextResponse.json({ error: "Missing file or title" }, { status: 400 })
      }
  
      // Convert file to buffer
      const fileBuffer = Buffer.from(await file.arrayBuffer())
  
      // ✅ Upload to S3 and get the file key
      const fileKey = await uploadToS3(fileBuffer, file.name)
  
      // ✅ Extract text using only the file key
      const extractedContent = await extractTextFromPDF(fileKey)
  
      // ✅ Construct public S3 URL manually
      const fileUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${fileKey}`
  
      // Metadata
      const metadata = {
        source: fileUrl,
        content: extractedContent,
        metadata: {
          size: file.size,
          title,
          file_type: "pdf",
          confidentiality: "public",
        },
      }
  
      return NextResponse.json(metadata, { status: 200 })
    } catch (error) {
      console.error("Upload Error:", error)
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
  }
  
