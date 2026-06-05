"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface PricePoint {
  date: string;
  close: number;
  volume: number;
}

// KIS 일자 "YYYYMMDD" → "MM.DD"
function formatDate(d: string): string {
  return d?.length === 8 ? `${d.slice(4, 6)}.${d.slice(6, 8)}` : d;
}

export function PriceChart({ data }: { data: PricePoint[] }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="h-32 w-full text-muted-foreground">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 10, fill: "currentColor" }}
            minTickGap={28}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={["dataMin", "dataMax"]}
            tick={{ fontSize: 10, fill: "currentColor" }}
            width={48}
            tickFormatter={(v: number) => v.toLocaleString("ko-KR")}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(20,20,20,0.92)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={(label) => formatDate(String(label))}
            formatter={(value) => [
              `${Number(value).toLocaleString("ko-KR")}원`,
              "종가",
            ]}
          />
          <Line
            type="monotone"
            dataKey="close"
            stroke="#34d399"
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
