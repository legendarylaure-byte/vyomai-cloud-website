import { useRef, useState, useEffect, useId } from "react";

export function OrbitalArc() {
  const ref = useRef<HTMLDivElement>(null);
  const [fired, setFired] = useState(false);
  const hasAnimated = useRef(false);
  const reactId = useId();
  const gradientId = `orbital-gradient-${reactId}`;
  const glowId = `orbital-glow-${reactId}`;

  useEffect(() => {
    const el = ref.current;
    if (!el || hasAnimated.current) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setFired(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          setFired(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`orbital-arc ${fired ? "orbital-arc--active" : ""}`}
      aria-hidden="true"
      role="presentation"
    >
      <svg className="orbital-arc__svg" viewBox="0 0 800 64" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--brand-start)" stopOpacity="0" />
            <stop offset="20%" stopColor="var(--brand-start)" stopOpacity="0.6" />
            <stop offset="50%" stopColor="var(--brand-mid)" stopOpacity="1" />
            <stop offset="80%" stopColor="var(--brand-end)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--brand-end)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={glowId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--brand-start)" stopOpacity="0" />
            <stop offset="30%" stopColor="var(--brand-start)" stopOpacity="0.15" />
            <stop offset="50%" stopColor="var(--brand-mid)" stopOpacity="0.25" />
            <stop offset="70%" stopColor="var(--brand-end)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--brand-end)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Glow line (thicker, blurred) */}
        <path
          className="orbital-arc__glow"
          d="M 0 48 Q 200 10, 400 32 Q 600 54, 800 16"
          fill="none"
          stroke={`url(#${glowId})`}
          strokeWidth="8"
        />
        {/* Main arc line */}
        <path
          className="orbital-arc__path"
          d="M 0 48 Q 200 10, 400 32 Q 600 54, 800 16"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      {/* Orbiting node */}
      <div className="orbital-arc__node">
        <div className="orbital-arc__node-dot" />
        <div className="orbital-arc__node-ring" />
      </div>
      {/* Center brand accent dot */}
      <div className="orbital-arc__center-dot" />
    </div>
  );
}
