import { useState, useEffect, useRef } from "react";

interface UseTypingOptions {
  texts: string[];
  typeSpeed?: number;
  deleteSpeed?: number;
  pauseDuration?: number;
  loop?: boolean;
}

export function useTyping(options: UseTypingOptions) {
  const {
    texts,
    typeSpeed = 80,
    deleteSpeed = 40,
    pauseDuration = 2000,
    loop = true,
  } = options;

  const [displayText, setDisplayText] = useState("");
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (texts.length === 0) return;

    const currentText = texts[textIndex];

    if (isPaused) {
      timeoutRef.current = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, pauseDuration);
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }

    if (!isDeleting) {
      // Typing
      if (charIndex < currentText.length) {
        timeoutRef.current = setTimeout(() => {
          setDisplayText(currentText.slice(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        }, typeSpeed);
      } else {
        // Finished typing, pause before deleting
        if (loop || textIndex < texts.length - 1) {
          setIsPaused(true);
        }
      }
    } else {
      // Deleting
      if (charIndex > 0) {
        timeoutRef.current = setTimeout(() => {
          setDisplayText(currentText.slice(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        }, deleteSpeed);
      } else {
        // Finished deleting, move to next text
        setIsDeleting(false);
        setTextIndex((textIndex + 1) % texts.length);
      }
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [texts, textIndex, charIndex, isDeleting, isPaused, typeSpeed, deleteSpeed, pauseDuration, loop]);

  return displayText;
}
