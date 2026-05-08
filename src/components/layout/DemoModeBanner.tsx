export function DemoModeBanner() {
  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center justify-center gap-2 text-xs font-medium text-amber-700">
      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse inline-block" />
      Demo Mode — All data resets periodically. For demonstration purposes only.
    </div>
  );
}
