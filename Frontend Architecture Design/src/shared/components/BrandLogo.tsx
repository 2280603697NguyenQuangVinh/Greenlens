export function BrandLogo({ className = "h-24" }: { className?: string }) {
  return (
    <div className={`${className} flex items-center justify-center rounded-2xl bg-green-100 text-green-700 font-black`}>
      GreenLens Kids
    </div>
  );
}

/** Full logo area from auth screens (magnifying glass + wordmark) */
export function AuthLogo() {
  return (
    <div className="flex flex-col items-center select-none">
      <div className="w-[min(100%,280px)] h-24 rounded-2xl bg-green-100 text-green-700 font-black flex items-center justify-center">
        GreenLens Kids ♻️
      </div>
    </div>
  );
}
