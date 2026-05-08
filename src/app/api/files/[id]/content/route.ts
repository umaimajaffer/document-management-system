import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import fs from "fs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fileAccessWhere } from "@/lib/access-control";
import { resolveStoredFilePath } from "@/lib/file-storage";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const file = await prisma.file.findFirst({
    where: { id: params.id, ...(await fileAccessWhere(session.user)) },
  });
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const diskPath = resolveStoredFilePath(file.path);
  if (!fs.existsSync(diskPath)) return NextResponse.json({ error: "File content not found" }, { status: 404 });

  const bytes = fs.readFileSync(diskPath);
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(bytes.byteLength),
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.originalName)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
