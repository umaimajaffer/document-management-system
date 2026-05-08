import { FileText, Image, File } from "lucide-react";
import { formatBytes, formatDate } from "@/lib/utils";
import { FileWithRelations } from "@/types";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

function FileTypeIcon({ mimeType }: { mimeType: string }) {
  if (mimeType === "application/pdf") return <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center"><FileText className="w-5 h-5 text-red-600" /></div>;
  if (mimeType.includes("word")) return <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center"><FileText className="w-5 h-5 text-blue-600" /></div>;
  if (mimeType.startsWith("image/")) return <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center"><Image className="w-5 h-5 text-emerald-600" /></div>;
  return <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center"><File className="w-5 h-5 text-slate-600" /></div>;
}

export function RecentUploads({ files }: { files: FileWithRelations[] }) {
  if (!files.length) {
    return <div className="text-center py-8 text-slate-400 text-sm">No recent uploads</div>;
  }
  return (
    <div className="space-y-2">
      {files.map((file) => (
        <Link key={file.id} href={`/documents/${file.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
          <FileTypeIcon mimeType={file.mimeType} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{file.name}</p>
            <p className="text-xs text-slate-400">{formatBytes(file.size)} · {file.uploadedBy?.name ?? "Unknown"}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {file.signature && <Badge variant="success" className="text-[10px]">Signed</Badge>}
            <span className="text-xs text-slate-400">{formatDate(file.createdAt)}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
