export function NepaliFlag({ className = "w-6 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id="flagClip">
          <path d="M0 0 L100 40 L100 55 L30 55 L100 100 L100 120 L0 120 Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#flagClip)">
        <rect x="0" y="0" width="100" height="120" fill="#DC143C" />
        <path
          d="M0 0 L100 40 L100 55 L30 55 L100 100 L100 120 L0 120 Z"
          fill="none"
          stroke="#003893"
          strokeWidth="8"
        />
        <g fill="#FFFFFF">
          <path
            d="M25 30 
               L28 22 L32 28 L40 25 L34 30 L40 35 L32 32 L28 38 L25 30 Z
               M25 25 L25 20 M20 30 L15 30 M30 30 L35 30 M25 35 L25 40"
            transform="translate(5, 5)"
          />
          <circle cx="32" cy="80" r="10" />
          <path
            d="M32 65 L35 72 L42 72 L37 77 L39 84 L32 80 L25 84 L27 77 L22 72 L29 72 Z"
            transform="translate(0, 2)"
          />
        </g>
      </g>
    </svg>
  );
}
