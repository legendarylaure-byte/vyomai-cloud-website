import { useCallback, useRef, MouseEvent } from "react";

interface UseMagneticOptions {
  strength?: number;
  range?: number;
}

export function useMagnetic(options: UseMagneticOptions = {}) {
  const { strength = 0.3, range = 100 } = options;
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const distance = Math.sqrt(x * x + y * y);
    if (distance < range) {
      const pull = (1 - distance / range) * strength;
      el.style.transform = `translate(${x * pull}px, ${y * pull}px)`;
      el.style.transition = "transform 0.2s cubic-bezier(0.32, 0.72, 0, 1)";
    }
  }, [strength, range]);

  const handleMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "translate(0, 0)";
    el.style.transition = "transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)";
  }, []);

  return { ref, handleMouseMove, handleMouseLeave };
}
