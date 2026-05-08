import path from "path";

export function resolveStoredFilePath(storedPath: string): string {
  if (path.isAbsolute(storedPath)) return storedPath;

  if (storedPath.startsWith("/uploads/")) {
    return path.join(process.cwd(), "public", storedPath);
  }

  return path.join(process.cwd(), storedPath);
}
