const DOT_COUNT = 5;

export function PageWaveLoader({ message }: { message: string }) {
  return (
    <div
      className="flex flex-col items-center gap-4"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="translation-wave-loader flex h-10 items-end justify-center gap-1.5">
        {Array.from({ length: DOT_COUNT }, (_, index) => (
          <span
            key={index}
            className="translation-wave-dot h-2 w-2 rounded-full bg-primary/80"
            style={{ animationDelay: `${index * 0.12}s` }}
          />
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
