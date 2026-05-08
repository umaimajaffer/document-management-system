import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin, isAdvancedOrAdmin } from "@/lib/permissions";
import { userScopeWhere } from "@/lib/access-control";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({
    where: isAdmin(session.user.role)
      ? {}
      : { AND: [await userScopeWhere(session.user, { includeSelf: false }), { isActive: true }] },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true,
      _count: { select: { uploadedFiles: true, sentMessages: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isAdvancedOrAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, email, password } = body;
  let { role } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email and password required" }, { status: 400 });
  }

  if (!isAdmin(session.user.role)) {
    role = "NORMAL_USER";
  } else {
    role = role ?? "NORMAL_USER";
  }

  if (!["ADVANCED_USER", "NORMAL_USER"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role, createdById: session.user.id },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  });
  return NextResponse.json({ user }, { status: 201 });
}
