export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-6 bg-white rounded-3xl border border-stone-200 h-32" />
        ))}
      </div>
      <div className="p-6 bg-white rounded-3xl border border-stone-200 h-96" />
    </div>
  );
}
