export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-cr-forest flex items-center justify-center text-white text-center p-6">
      <div>
        <div className="text-6xl mb-4">📡</div>
        <h1 className="font-display text-3xl font-semibold mb-2">You&apos;re offline</h1>
        <p className="font-body text-white/70 mb-6">
          No internet connection. Your notes will sync when you&apos;re back online.
        </p>
        <p className="text-sm font-body text-white/50">Careroot · careroot.care</p>
      </div>
    </div>
  );
}
