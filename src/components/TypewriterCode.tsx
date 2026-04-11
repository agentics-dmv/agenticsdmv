import { useEffect, useRef, useState } from "react";

interface TypewriterCodeProps {
  children: React.ReactNode;
}

export function TypewriterCode({ children }: TypewriterCodeProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [displayText, setDisplayText] = useState("");
  const fullText = typeof children === "string" ? children : String(children ?? "");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayText(fullText.slice(0, i));
      if (i >= fullText.length) clearInterval(interval);
    }, 30);

    return () => clearInterval(interval);
  }, [visible, fullText]);

  return (
    <code ref={ref} className="text-sm bg-muted px-1.5 py-0.5 rounded font-mono">
      {visible ? displayText : <span className="opacity-0">{fullText}</span>}
      {visible && displayText.length < fullText.length && (
        <span className="animate-pulse">▋</span>
      )}
    </code>
  );
}
