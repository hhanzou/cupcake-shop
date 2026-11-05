const COLORS = ["#ff8fb8", "#dccbff", "#ffe9a8", "#ffffff", "#d6345a"]

/** Granulados caindo, só decorativos. Posições fixas para não divergir entre servidor e cliente. */
export function Confetti() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0">
      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          className="animate-sprinkle absolute top-0 h-1.5 w-3 rounded-full"
          style={{
            left: `${(i * 37) % 100}%`,
            backgroundColor: COLORS[i % COLORS.length],
            animationDelay: `${(i % 6) * 120}ms`,
            ["--rot" as string]: `${(i * 47) % 360}deg`,
          }}
        />
      ))}
    </span>
  )
}
