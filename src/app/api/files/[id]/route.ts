import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canRenameFiles, canDeleteFiles } from "@/lib/permissions";
import { canManageFile, fileAccessWhere, serializeFileForClient } from "@/lib/access-control";
import { resolveStoredFilePath } from "@/lib/file-storage";
import fs from "fs";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const file = await prisma.file.findFirst({
    where: { id: params.id, ...(await fileAccessWhere(session.user)) },
    include: {
      uploadedBy: { select: { name: true, email: true } },
      signature: { include: { signedBy: { select: { name: true } } } },
      folder: { select: { id: true, name: true } },
    },
  });
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ file: serializeFileForClient(file) });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!canRenameFiles(session.user.role) || !(await canManageFile(session.user, params.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name } = body;
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const file = await prisma.file.update({
    where: { id: params.id },
    data: { name: name.trim() },
  });
  return NextResponse.json({ file });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!canDeleteFiles(session.user.role) || !(await canManageFile(session.user, params.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const file = await prisma.file.findFirst({ where: { id: params.id, ...(await fileAccessWhere(session.user)) } });
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete from disk if not a sample file
  if (!file.path.includes("/samples/")) {
    try {
      const diskPath = resolveStoredFilePath(file.path);
      if (fs.existsSync(diskPath)) fs.unlinkSync(diskPath);
    } catch {}
  }

  await prisma.file.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
