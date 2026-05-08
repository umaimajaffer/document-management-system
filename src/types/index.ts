export type Role = "ADMIN" | "ADVANCED_USER" | "NORMAL_USER";

export interface UserSession {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
}

export interface FolderWithCounts {
  id: string;
  name: string;
  parentId: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: { files: number; children: number };
}

export interface FileWithRelations {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  folderId: string | null;
  uploadedById: string;
  createdAt: Date;
  updatedAt: Date;
  uploadedBy?: { name: string; email: string };
  signature?: SignatureData | null;
}

export interface SignatureData {
  id: string;
  fileId: string;
  signedById: string;
  signatureData: string;
  signedAt: Date;
  signedBy?: { name: string };
}

export interface NotificationData {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
}

export interface MessageData {
  id: string;
  senderId: string;
  recipientId: string;
  subject: string;
  body: string;
  channel: string;
  isRead: boolean;
  createdAt: Date;
  sender?: { name: string; email: string };
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  _count?: { uploadedFiles: number; sentMessages: number };
}
