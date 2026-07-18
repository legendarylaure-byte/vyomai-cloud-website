import { useCallback, MouseEvent, useRef } from "react";

interface UseTiltOptions {
  maxTilt?: number;
  scale?: number;
  speed?: number;
}

export function useTilt(options: UseTiltOptions = {}) {
  const { maxTilt = 8, scale = 1.02, speed = 400 } = options;
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`;
    el.style.transition = `transform ${speed}ms cubic-bezier(0.32, 0.72, 0, 1)`;
  }, [maxTilt, scale, speed]);

  const handleMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    el.style.transition = `transform ${speed}ms cubic-bezier(0.32, 0.72, 0, 1)`;
  }, [speed]);

  return { ref, handleMouseMove, handleMouseLeave };
}
