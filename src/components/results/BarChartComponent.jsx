import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TYPE_NAMES, TYPE_COLORS } from "@/lib/enneagramData";

export default function BarChartComponent({ percentages }) {
  const data = Object.entries(percentages)
    .map(([type, value]) => ({
      type: `T${type}`,
      typeNum: parseInt(type),
      fullName: TYPE_NAMES[parseInt(type)],
      value,
      color: TYPE_COLORS[parseInt(type)]
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="w-full h-[300px] sm:h-[380px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
          <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="type"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 600 }}
            width={35}
          />
          <Tooltip
            content={({ payload }) => {
              if (!payload || !payload[0]) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
                  <p className="text-sm font-semibold text-foreground">{d.fullName}</p>
                  <p className="text-xs font-medium" style={{ color: d.color }}>{d.value}%</p>
                </div>
              );
            }}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}