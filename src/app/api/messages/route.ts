import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canSendMessages } from "@/lib/permissions";
import { assertUsersInScope, isAdminUser, userScopeWhere } from "@/lib/access-control";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const inbox = await prisma.message.findMany({
    where: {
      OR: [
        { recipientId: session.user.id },
        ...(isAdminUser(session.user) ? [{ recipientId: "all" }] : []),
        { senderId: session.user.id },
      ],
    },
    include: { sender: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ messages: inbox });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!canSendMessages(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { recipientId, subject, body: msgBody, channel } = body;

  if (!recipientId || !subject || !msgBody) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (recipientId === "all" && !isAdminUser(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (recipientId !== "all" && !(await assertUsersInScope(session.user, [recipientId]))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const message = await prisma.message.create({
    data: {
      senderId: session.user.id,
      recipientId,
      subject,
      body: msgBody,
      channel: channel ?? "in_app",
    },
    include: { sender: { select: { name: true, email: true } } },
  });

  // Create notification for recipient
  const senderName = session.user.name ?? "Someone";
  let notifTitle = `New message from ${senderName}`;
  let notifBody = subject;

  if (channel === "simulated_sms") {
    notifTitle = `SMS from ${senderName} (simulated)`;
    notifBody = `${subject}: ${msgBody.slice(0, 80)}`;
  } else if (channel === "simulated_email") {
    notifTitle = `Email from ${senderName} (simulated)`;
    notifBody = `Subject: ${subject}`;
  }

  if (recipientId !== session.user.id) {
    const recipients = recipientId === "all"
      ? await prisma.user.findMany({ where: { id: { not: session.user.id } }, select: { id: true } })
      : await prisma.user.findMany({ where: { AND: [await userScopeWhere(session.user), { id: recipientId }] }, select: { id: true } });

    for (const r of recipients) {
      await prisma.notification.create({
        data: {
          userId: r.id,
          title: notifTitle,
          body: notifBody,
          type: channel === "simulated_sms" || channel === "simulated_email" ? "info" : "info",
        },
      });
    }
  }

  // Simulated channel metadata for client display
  const simulatedMeta =
    channel === "simulated_sms"
      ? { simulatedChannel: "sms", phone: "+1 (555) 000-0000" }
      : channel === "simulated_email"
      ? { simulatedChannel: "email", email: "recipient@demo.com" }
      : null;

  return NextResponse.json({ message, simulatedMeta }, { status: 201 });
}
