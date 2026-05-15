'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

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

function CustomTooltip({
  active,
  payload,
  label,
  currentYearLabel,
  previousYearLabel,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string }[];
  label?: string;
  currentYearLabel: string;
  previousYearLabel: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-surface-vault border border-zinc-700 rounded-md px-3 py-2 shadow-lg">
      <p className="text-[10px] uppercase tracking-widest text-text-muted-vault mb-1">
        {label}
      </p>
      {payload.map((entry) => (
        <p
          key={entry.dataKey}
          className="text-xs"
          style={{ color: entry.dataKey === 'currentYear' ? '#D4AF37' : '#71717a' }}
        >
          {entry.dataKey === 'currentYear' ? currentYearLabel : previousYearLabel}:{' '}
          <span className="font-semibold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function CitationsChart({
  data,
  currentYearLabel,
  previousYearLabel,
}: CitationsChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-surface-elevated p-5 sm:p-6 md:p-10">
        <h4 className="font-heading text-xl md:text-2xl font-bold text-foreground">Citations Over Time</h4>
        <p className="mt-2 text-xs text-text-muted-vault uppercase tracking-widest">
          No citation data yet
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface-elevated p-5 sm:p-6 md:p-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 mb-6 md:mb-12">
        <div>
          <h4 className="font-heading text-xl md:text-2xl font-bold text-foreground">Citations Over Time</h4>
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

      <div className="h-48 sm:h-56 md:h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="citationGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="#353534"
              strokeDasharray="4"
              strokeWidth={0.5}
              vertical={false}
            />

            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: '#71717a' }}
              tickFormatter={(value: string) => value.toUpperCase()}
              axisLine={false}
              tickLine={false}
              dy={10}
            />

            <YAxis
              tick={{ fontSize: 10, fill: '#71717a' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />

            <Tooltip
              content={
                <CustomTooltip
                  currentYearLabel={currentYearLabel}
                  previousYearLabel={previousYearLabel}
                />
              }
              cursor={{ stroke: '#D4AF37', strokeWidth: 1, strokeDasharray: '4' }}
            />

            <Area
              type="monotone"
              dataKey="currentYear"
              stroke="#D4AF37"
              strokeWidth={3}
              fill="url(#citationGradient)"
              dot={false}
              activeDot={{ r: 5, fill: '#D4AF37', stroke: '#131313', strokeWidth: 2 }}
            />

            <Area
              type="monotone"
              dataKey="previousYear"
              stroke="#525252"
              strokeWidth={2}
              strokeDasharray="8"
              fill="none"
              dot={false}
              activeDot={{ r: 4, fill: '#525252', stroke: '#131313', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
