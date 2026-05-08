import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fileAccessWhere } from "@/lib/access-control";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { fileId, signatureData } = body;

  if (!fileId || !signatureData) {
    return NextResponse.json({ error: "fileId and signatureData are required" }, { status: 400 });
  }

  const file = await prisma.file.findFirst({
    where: { id: fileId, ...(await fileAccessWhere(session.user)) },
    select: { id: true },
  });
  if (!file) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Check if already signed
  const existing = await prisma.signature.findUnique({ where: { fileId } });
  if (existing) {
    return NextResponse.json({ error: "Document already signed" }, { status: 409 });
  }

  const signature = await prisma.signature.create({
    data: {
      fileId,
      signedById: session.user.id,
      signatureData,
    },
    include: { signedBy: { select: { name: true } } },
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: session.user.id,
      title: "Document signed",
      body: `You signed a document successfully.`,
      type: "success",
    },
  });

  return NextResponse.json({ signature }, { status: 201 });
}
