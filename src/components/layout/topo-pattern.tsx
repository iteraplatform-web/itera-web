/**
 * Faint contour lines, like a survey map — a quiet nod to property without
 * being literal. Sits behind the sidebar greeting.
 */
export function TopoPattern({ className }: { className?: string }) {
  const lines = Array.from({ length: 14 }, (_, i) => i);
  return (
    <svg viewBox="0 0 300 320" preserveAspectRatio="xMidYMin slice" className={className} aria-hidden>
      {lines.map((i) => {
        const y = 12 + i * 21;
        const a = 10 + (i % 4) * 4;
        return (
          <path
            key={i}
            d={`M-20 ${y} C 40 ${y - a}, 90 ${y + a}, 150 ${y - a / 2} S 260 ${y + a}, 330 ${y - a / 3}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity={0.55 - i * 0.03}
          />
        );
      })}
    </svg>
  );
}
