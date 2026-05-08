import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdvancedOrAdmin } from "@/lib/permissions";
import { canAccessFolder, folderAccessWhere } from "@/lib/access-control";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parentId = req.nextUrl.searchParams.get("parentId") || null;
  if (parentId && !(await canAccessFolder(session.user, parentId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const folders = await prisma.folder.findMany({
    where: { parentId, ...(await folderAccessWhere(session.user)) },
    include: { _count: { select: { files: true, children: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ folders });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdvancedOrAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, parentId } = body;
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  if (parentId && !(await canAccessFolder(session.user, parentId, "edit"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const folder = await prisma.folder.create({
    data: { name: name.trim(), parentId: parentId || null, ownerId: session.user.id },
    include: { _count: { select: { files: true, children: true } } },
  });

  return NextResponse.json({ folder }, { status: 201 });
}
