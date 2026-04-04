'use client';

type MonthlyData = {
  month: string;
  currentYear: number;
  previousYear: number;
};

type CitationsChartProps = {
  data: MonthlyData[];
  currentYearLabel: string;
  previousYearLabel: string;
};

function toPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    d += ` C${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
  }
  return d;
}

export default function CitationsChart({
  data,
  currentYearLabel,
  previousYearLabel,
}: CitationsChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-surface-elevated p-10">
        <h4 className="font-heading text-2xl font-bold text-foreground">Citations Over Time</h4>
        <p className="mt-2 text-xs text-text-muted-vault uppercase tracking-widest">
          No citation data yet
        </p>
      </div>
    );
  }

  const allValues = data.flatMap((d) => [d.currentYear, d.previousYear]);
  const maxVal = Math.max(...allValues, 1);

  const W = 1000;
  const H = 200;
  const padX = 0;

  const currentPoints = data.map((d, i) => ({
    x: padX + (i / (data.length - 1)) * (W - padX * 2),
    y: H - (d.currentYear / maxVal) * (H - 20),
  }));

  const previousPoints = data.map((d, i) => ({
    x: padX + (i / (data.length - 1)) * (W - padX * 2),
    y: H - (d.previousYear / maxVal) * (H - 20),
  }));

  const currentPath = toPath(currentPoints);
  const previousPath = toPath(previousPoints);

  const areaPath = `${currentPath} L${W},${H} L0,${H} Z`;

  return (
    <div className="bg-surface-elevated p-10">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h4 className="font-heading text-2xl font-bold text-foreground">Citations Over Time</h4>
          <p className="text-xs text-text-muted-vault uppercase tracking-widest mt-2">
            Aggregate growth across all manuscripts
          </p>
        </div>
        <div className="flex gap-4">
          <span className="text-[10px] uppercase tracking-widest text-gold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gold" />
            {currentYearLabel}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-zinc-700" />
            {previousYearLabel}
          </span>
        </div>
      </div>

      <div className="relative h-64 w-full">
        <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 50, 100, 150].map((y) => (
            <line key={y} x1="0" x2={W} y1={y} y2={y} stroke="#353534" strokeDasharray="4" strokeWidth="0.5" />
          ))}

          {/* Area gradient */}
          <defs>
            <linearGradient id="citationGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Current year area fill */}
          <path d={areaPath} fill="url(#citationGradient)" />

          {/* Current year line */}
          <path d={currentPath} fill="none" stroke="#D4AF37" strokeWidth="3" strokeLinecap="round" />

          {/* Previous year line (dashed) */}
          <path d={previousPath} fill="none" stroke="#353534" strokeWidth="2" strokeDasharray="8" />

          {/* Data points on current year */}
          {currentPoints.map((pt, i) => {
            if (i === currentPoints.length - 1) {
              return <circle key={i} cx={pt.x} cy={pt.y} r="6" fill="#D4AF37" />;
            }
            if (i % 3 === 1) {
              return (
                <circle key={i} cx={pt.x} cy={pt.y} r="4" fill="#131313" stroke="#D4AF37" strokeWidth="2" />
              );
            }
            return null;
          })}
        </svg>

        {/* Month axis labels */}
        <div className="flex justify-between mt-6 text-[10px] text-zinc-500 uppercase tracking-tighter">
          {data.map((d) => (
            <span key={d.month}>{d.month}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
