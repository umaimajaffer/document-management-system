import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canCopyFiles } from "@/lib/permissions";
import { canAccessFolder, canManageFile, fileAccessWhere, serializeFileForClient } from "@/lib/access-control";
import { resolveStoredFilePath } from "@/lib/file-storage";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!canCopyFiles(session.user.role) || !(await canManageFile(session.user, params.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const original = await prisma.file.findFirst({ where: { id: params.id, ...(await fileAccessWhere(session.user)) } });
  if (!original) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const targetFolderId = body.targetFolderId ?? original.folderId;
  if (targetFolderId && !(await canAccessFolder(session.user, targetFolderId, "edit"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let newPath = original.path;

  // Copy on disk if not a sample
  if (!original.path.includes("/samples/")) {
    try {
      const srcDisk = resolveStoredFilePath(original.path);
      const ext = path.extname(original.path);
      const newFilename = `${randomUUID()}${ext}`;
      const userDir = path.join(process.cwd(), "storage", "uploads", session.user.id);
      fs.mkdirSync(userDir, { recursive: true });
      const destDisk = path.join(userDir, newFilename);
      fs.copyFileSync(srcDisk, destDisk);
      newPath = `storage/uploads/${session.user.id}/${newFilename}`;
    } catch {}
  }

  const copy = await prisma.file.create({
    data: {
      name: `Copy of ${original.name}`,
      originalName: original.originalName,
      mimeType: original.mimeType,
      size: original.size,
      path: newPath,
      folderId: targetFolderId,
      uploadedById: session.user.id,
    },
  });
  return NextResponse.json({ file: serializeFileForClient(copy) }, { status: 201 });
}
