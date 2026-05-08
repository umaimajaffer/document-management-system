import type { Session } from "next-auth";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type SessionUser = Session["user"];

export function isAdminUser(user: SessionUser): boolean {
  return user.role === "ADMIN";
}

export function isPrivilegedUser(user: SessionUser): boolean {
  return user.role === "ADVANCED_USER";
}

export async function getScopedUserIds(user: SessionUser): Promise<string[] | null> {
  if (isAdminUser(user)) return null;

  if (isPrivilegedUser(user)) {
    const managedUsers = await prisma.user.findMany({
      where: { createdById: user.id, role: "NORMAL_USER", isActive: true },
      select: { id: true },
    });
    return [user.id, ...managedUsers.map((managedUser) => managedUser.id)];
  }

  return [user.id];
}

export async function userInScope(user: SessionUser, targetUserId: string): Promise<boolean> {
  const scopedUserIds = await getScopedUserIds(user);
  return scopedUserIds === null || scopedUserIds.includes(targetUserId);
}

export async function userScopeWhere(user: SessionUser, options: { includeSelf?: boolean } = {}): Promise<Prisma.UserWhereInput> {
  if (isAdminUser(user)) return {};

  const includeSelf = options.includeSelf ?? true;
  if (isPrivilegedUser(user)) {
    return {
      OR: [
        ...(includeSelf ? [{ id: user.id }] : []),
        { createdById: user.id, role: "NORMAL_USER" },
      ],
    };
  }

  return includeSelf ? { id: user.id } : { id: "__no_access__" };
}

export async function folderAccessWhere(user: SessionUser, mode: "view" | "edit" = "view"): Promise<Prisma.FolderWhereInput> {
  if (isAdminUser(user)) return {};

  const scopedUserIds = await getScopedUserIds(user);
  if (!scopedUserIds) return {};

  const accessPermission = mode === "edit" ? { userId: user.id, canEdit: true } : { userId: user.id, canView: true };
  const shareOwnerIds = await getShareOwnerIds(user, scopedUserIds);

  return {
    OR: [
      { ownerId: { in: scopedUserIds } },
      {
        ownerId: { in: shareOwnerIds },
        access: { some: accessPermission },
      },
    ],
  };
}

async function getShareOwnerIds(user: SessionUser, scopedUserIds: string[]): Promise<string[]> {
  if (isPrivilegedUser(user)) return scopedUserIds;
  if (user.role !== "NORMAL_USER") return scopedUserIds;

  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { createdById: true },
  });

  return currentUser?.createdById ? [user.id, currentUser.createdById] : [user.id];
}

export async function fileAccessWhere(user: SessionUser): Promise<Prisma.FileWhereInput> {
  if (isAdminUser(user)) return {};

  const scopedUserIds = await getScopedUserIds(user);
  if (!scopedUserIds) return {};

  return {
    OR: [
      { uploadedById: { in: scopedUserIds } },
      { folder: await folderAccessWhere(user, "view") },
    ],
  };
}

export async function canManageUser(actor: SessionUser, targetUserId: string): Promise<boolean> {
  if (isAdminUser(actor)) return true;
  if (!isPrivilegedUser(actor)) return false;

  const target = await prisma.user.findFirst({
    where: { id: targetUserId, createdById: actor.id, role: "NORMAL_USER" },
    select: { id: true },
  });
  return Boolean(target);
}

export async function canManageFolder(actor: SessionUser, folderId: string): Promise<boolean> {
  if (isAdminUser(actor)) return true;
  if (!isPrivilegedUser(actor)) return false;

  const folder = await prisma.folder.findFirst({
    where: { id: folderId, ...(await folderAccessWhere(actor, "edit")) },
    select: { id: true },
  });
  return Boolean(folder);
}

export async function canAccessFolder(actor: SessionUser, folderId: string, mode: "view" | "edit" = "view"): Promise<boolean> {
  const folder = await prisma.folder.findFirst({
    where: { id: folderId, ...(await folderAccessWhere(actor, mode)) },
    select: { id: true },
  });
  return Boolean(folder);
}

export async function canManageFile(actor: SessionUser, fileId: string): Promise<boolean> {
  if (isAdminUser(actor)) return true;
  if (!isPrivilegedUser(actor)) return false;

  const file = await prisma.file.findFirst({
    where: { id: fileId, ...(await fileAccessWhere(actor)) },
    select: { id: true },
  });
  return Boolean(file);
}

export async function assertUsersInScope(actor: SessionUser, userIds: string[]): Promise<boolean> {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  if (uniqueIds.length === 0) return true;

  const scopedUserIds = await getScopedUserIds(actor);
  if (scopedUserIds === null) return true;

  return uniqueIds.every((id) => scopedUserIds.includes(id));
}

export function privateFileUrl(fileId: string): string {
  return `/api/files/${fileId}/content`;
}

export function serializeFileForClient<T extends { id: string; path: string }>(file: T): T {
  return { ...file, path: privateFileUrl(file.id) };
}
