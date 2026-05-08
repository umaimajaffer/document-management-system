import type { Role } from "@/types";

export function isAdmin(role: string): boolean {
  return role === "ADMIN";
}

export function isAdvancedOrAdmin(role: string): boolean {
  return role === "ADMIN" || role === "ADVANCED_USER";
}

export function canManageFolders(role: string): boolean {
  return role === "ADMIN" || role === "ADVANCED_USER";
}

export function canUploadFiles(role: string): boolean {
  return role === "ADMIN" || role === "ADVANCED_USER";
}

export function canDeleteFiles(role: string): boolean {
  return role === "ADMIN" || role === "ADVANCED_USER";
}

export function canCopyFiles(role: string): boolean {
  return role === "ADMIN" || role === "ADVANCED_USER";
}

export function canMoveFiles(role: string): boolean {
  return role === "ADMIN" || role === "ADVANCED_USER";
}

export function canRenameFiles(role: string): boolean {
  return role === "ADMIN" || role === "ADVANCED_USER";
}

export function canGrantAccess(role: string): boolean {
  return role === "ADMIN" || role === "ADVANCED_USER";
}

export function canManageUsers(role: string): boolean {
  return role === "ADMIN" || role === "ADVANCED_USER";
}

export function canSendMessages(role: string): boolean {
  return role === "ADMIN" || role === "ADVANCED_USER";
}

export function getRoleLabel(role: string): string {
  switch (role) {
    case "ADMIN": return "Admin";
    case "ADVANCED_USER": return "Advanced User";
    case "NORMAL_USER": return "Normal User";
    default: return role;
  }
}
