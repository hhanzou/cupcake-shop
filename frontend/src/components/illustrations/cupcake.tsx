export function CupcakeIllustration({
  className,
  title = "Cupcake ilustrado",
}: {
  className?: string
  title?: string
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      role="img"
      aria-label={title}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M26 62h68l-9 46a6 6 0 0 1-6 5H41a6 6 0 0 1-6-5z" fill="#ffd6e5" />
      <path d="M44 62l4 51M60 62v51M76 62l-4 51" stroke="#ff8fb8" strokeWidth="3" strokeLinecap="round" opacity=".6" />
      <path
        d="M22 62c-4-14 8-22 18-20 2-14 16-22 28-16 10 4 14 10 14 16 12-2 20 8 16 20z"
        fill="#fff"
        stroke="#ff8fb8"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="60" cy="20" r="8" fill="#d6345a" />
      <path d="M60 12c0-4 3-7 7-7" stroke="#5b3a3f" strokeWidth="3" strokeLinecap="round" fill="none" />
      <rect x="40" y="40" width="9" height="3.5" rx="1.75" fill="#dccbff" transform="rotate(-25 44 42)" />
      <rect x="70" y="36" width="9" height="3.5" rx="1.75" fill="#bdebdd" transform="rotate(20 74 38)" />
      <rect x="56" y="48" width="9" height="3.5" rx="1.75" fill="#ffe9a8" transform="rotate(8 60 50)" />
      <circle cx="52" cy="80" r="3" fill="#5b3a3f" />
      <circle cx="68" cy="80" r="3" fill="#5b3a3f" />
      <path d="M55 89q5 5 10 0" stroke="#5b3a3f" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  )
}
