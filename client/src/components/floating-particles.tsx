import { useMemo } from "react";

interface FloatingParticlesProps {
  count?: number;
  className?: string;
}

export function FloatingParticles({ count = 20, className = "" }: FloatingParticlesProps) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 2,
      duration: Math.random() * 6 + 6,
      delay: Math.random() * 4,
      tx: (Math.random() - 0.5) * 40,
      ty: (Math.random() - 0.5) * 40,
      opacity: Math.random() * 0.4 + 0.2,
    }));
  }, [count]);

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="floating-particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: `radial-gradient(circle, rgba(138, 80, 232, ${p.opacity}), rgba(192, 96, 208, ${p.opacity * 0.5}))`,
            "--duration": `${p.duration}s`,
            "--delay": `${p.delay}s`,
            "--tx": `${p.tx}px`,
            "--ty": `${p.ty}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
