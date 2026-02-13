export default function BlogReadingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr_320px]">
      {children}
    </div>
  );
}
