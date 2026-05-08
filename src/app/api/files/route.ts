import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdvancedOrAdmin } from "@/lib/permissions";
import { canAccessFolder, fileAccessWhere, serializeFileForClient } from "@/lib/access-control";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
];

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const folderId = req.nextUrl.searchParams.get("folderId");
  if (folderId && !(await canAccessFolder(session.user, folderId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const files = await prisma.file.findMany({
    where: { ...(folderId ? { folderId } : {}), ...(await fileAccessWhere(session.user)) },
    include: {
      uploadedBy: { select: { name: true } },
      signature: { include: { signedBy: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({ files: files.map(serializeFileForClient) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdvancedOrAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folderId = formData.get("folderId") as string | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (folderId && !(await canAccessFolder(session.user, folderId, "edit"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = path.extname(file.name) || ".bin";
  const filename = `${randomUUID()}${ext}`;
  const userDir = path.join(process.cwd(), "storage", "uploads", session.user.id);
  fs.mkdirSync(userDir, { recursive: true });
  fs.writeFileSync(path.join(userDir, filename), buffer);

  const record = await prisma.file.create({
    data: {
      name: file.name,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      path: `storage/uploads/${session.user.id}/${filename}`,
      folderId: folderId || null,
      uploadedById: session.user.id,
    },
    include: { uploadedBy: { select: { name: true } }, signature: true },
  });

  // Create notification for all users about the upload
  await prisma.notification.create({
    data: {
      userId: session.user.id,
      title: "File uploaded",
      body: `You uploaded "${file.name}"`,
      type: "success",
    },
  });

  return NextResponse.json({ file: serializeFileForClient(record) }, { status: 201 });
}
