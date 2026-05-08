import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin, isAdvancedOrAdmin, canGrantAccess } from "@/lib/permissions";
import { assertUsersInScope, canManageFolder, fileAccessWhere, folderAccessWhere, serializeFileForClient } from "@/lib/access-control";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const folder = await prisma.folder.findFirst({
    where: { id: params.id, ...(await folderAccessWhere(session.user)) },
    include: {
      children: {
        where: await folderAccessWhere(session.user),
        include: { _count: { select: { files: true, children: true } } },
        orderBy: { name: "asc" },
      },
      files: {
        where: await fileAccessWhere(session.user),
        include: { uploadedBy: { select: { name: true } }, signature: { include: { signedBy: { select: { name: true } } } } },
        orderBy: { createdAt: "desc" },
      },
      parent: true,
      access: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });

  if (!folder) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ folder: { ...folder, files: folder.files.map(serializeFileForClient) } });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdvancedOrAdmin(session.user.role) || !(await canManageFolder(session.user, params.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, access } = body;

  if (name) {
    await prisma.folder.update({ where: { id: params.id }, data: { name: name.trim() } });
  }

  if (access && canGrantAccess(session.user.role)) {
    // access = [{ userId, canView, canEdit }]
    const userIds = access.map((item: { userId: string }) => item.userId);
    if (!(await assertUsersInScope(session.user, userIds))) {
      return NextResponse.json({ error: "Cannot grant access outside your scope" }, { status: 403 });
    }
    for (const item of access) {
      await prisma.folderAccess.upsert({
        where: { folderId_userId: { folderId: params.id, userId: item.userId } },
        create: { folderId: params.id, userId: item.userId, canView: item.canView, canEdit: item.canEdit },
        update: { canView: item.canView, canEdit: item.canEdit },
      });
    }
  }

  const updated = await prisma.folder.findUnique({
    where: { id: params.id },
    include: { _count: { select: { files: true, children: true } } },
  });
  return NextResponse.json({ folder: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdmin(session.user.role) && !(await canManageFolder(session.user, params.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete files on disk is omitted for simplicity — POC level
  await prisma.folder.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
