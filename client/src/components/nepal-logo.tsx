// Nepal Map Logo - SVG representation of Nepal with cultural elements
export function NepalLogo() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="hover:scale-110 transition-transform duration-300"
    >
      {/* Nepal Map Shape (simplified) */}
      <path
        d="M8 15 Q12 10 18 12 Q24 9 28 14 Q30 18 26 22 Q20 24 18 20 Q14 23 10 22 Q6 20 8 15"
        fill="currentColor"
        className="text-primary"
        opacity="0.8"
      />
      
      {/* Mandala Pattern - Center (Kathmandu) */}
      <circle cx="18" cy="18" r="3" fill="currentColor" className="text-accent" />
      <circle cx="18" cy="18" r="5" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-accent" opacity="0.6" />
      
      {/* Mount Everest indicator (North) */}
      <path
        d="M18 8 L20 12 L16 12 Z"
        fill="currentColor"
        className="text-primary"
        opacity="0.6"
      />
      
      {/* Decorative circles representing cities */}
      <circle cx="12" cy="20" r="1.5" fill="currentColor" className="text-primary" opacity="0.7" />
      <circle cx="25" cy="18" r="1.5" fill="currentColor" className="text-primary" opacity="0.7" />
    </svg>
  );
}
