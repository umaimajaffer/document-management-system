import path from "path";

export function getUploadRoot(): string {
  if (process.env.FILE_STORAGE_ROOT) return path.resolve(process.env.FILE_STORAGE_ROOT);
  if (process.env.VERCEL) return path.join("/tmp", "docupoc-uploads");
  return path.join(process.cwd(), "storage", "uploads");
}

export function resolveStoredFilePath(storedPath: string): string {
  if (path.isAbsolute(storedPath)) return storedPath;

  if (storedPath.startsWith("/uploads/")) {
    return path.join(process.cwd(), "public", storedPath);
  }

  if (storedPath.startsWith("storage/uploads/")) {
    return path.join(getUploadRoot(), storedPath.replace(/^storage\/uploads\//, ""));
  }

  return path.join(process.cwd(), storedPath);
}

export function storedUploadPath(userId: string, filename: string): string {
  return `storage/uploads/${userId}/${filename}`;
}
