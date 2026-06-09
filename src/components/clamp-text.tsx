"use client";

import { useState, useRef, useLayoutEffect } from "react";

interface ClampTextProps {
  text: string;
  className?: string;
  lines?: 2 | 3 | 4;
}

const CLAMP_CLASS: Record<number, string> = {
  2: "line-clamp-2",
  3: "line-clamp-3",
  4: "line-clamp-4",
};

// 기본은 지정 줄 수로 클램, 넘칠 때만 "더 보기/접기" 토글 노출
export function ClampText({ text, className, lines = 3 }: ClampTextProps) {
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el) setClamped(el.scrollHeight > el.clientHeight + 1);
  }, [text]);

  return (
    <div>
      <p
        ref={ref}
        className={`${className ?? ""} ${expanded ? "" : CLAMP_CLASS[lines]}`}
      >
        {text}
      </p>
      {(clamped || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs font-medium text-primary/80 hover:text-primary"
        >
          {expanded ? "접기" : "더 보기"}
        </button>
      )}
    </div>
  );
}
