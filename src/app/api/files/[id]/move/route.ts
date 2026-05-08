import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canMoveFiles } from "@/lib/permissions";
import { canAccessFolder, canManageFile, serializeFileForClient } from "@/lib/access-control";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!canMoveFiles(session.user.role) || !(await canManageFile(session.user, params.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { targetFolderId } = body;
  if (targetFolderId && !(await canAccessFolder(session.user, targetFolderId, "edit"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const file = await prisma.file.update({
    where: { id: params.id },
    data: { folderId: targetFolderId || null },
  });
  return NextResponse.json({ file: serializeFileForClient(file) });
}
