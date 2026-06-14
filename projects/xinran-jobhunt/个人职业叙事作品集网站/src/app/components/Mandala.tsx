export function Mandala({ className = "", opacity = 0.08 }: { className?: string; opacity?: number }) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      style={{ opacity }}
      aria-hidden
    >
      <g fill="none" stroke="#8B5A2B" strokeWidth="0.6">
        <circle cx="200" cy="200" r="180" />
        <circle cx="200" cy="200" r="150" />
        <circle cx="200" cy="200" r="110" />
        <circle cx="200" cy="200" r="70" />
        <circle cx="200" cy="200" r="30" />
        {Array.from({ length: 16 }).map((_, i) => {
          const a = (i * Math.PI) / 8;
          const x = 200 + Math.cos(a) * 180;
          const y = 200 + Math.sin(a) * 180;
          return <line key={i} x1="200" y1="200" x2={x} y2={y} />;
        })}
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * Math.PI) / 4;
          const cx = 200 + Math.cos(a) * 110;
          const cy = 200 + Math.sin(a) * 110;
          return <circle key={i} cx={cx} cy={cy} r="40" />;
        })}
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * Math.PI) / 6;
          const cx = 200 + Math.cos(a) * 150;
          const cy = 200 + Math.sin(a) * 150;
          return (
            <path
              key={`p-${i}`}
              d={`M ${cx} ${cy} q 10 -20 20 0 q -10 20 -20 0 z`}
            />
          );
        })}
      </g>
    </svg>
  );
}
