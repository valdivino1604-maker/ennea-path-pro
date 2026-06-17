import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TYPE_NAMES, TYPE_COLORS } from "@/lib/enneagramData";

export default function AdminStatsChart({ typeCounts }) {
  const data = Object.entries(typeCounts).map(([type, count]) => ({
    type: `T${type}`,
    fullName: TYPE_NAMES[parseInt(type)],
    count,
    color: TYPE_COLORS[parseInt(type)]
  }));

  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="type" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 600 }} />
          <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} allowDecimals={false} />
          <Tooltip
            content={({ payload }) => {
              if (!payload || !payload[0]) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
                  <p className="text-sm font-semibold text-foreground">{d.fullName}</p>
                  <p className="text-xs font-medium" style={{ color: d.color }}>{d.count} testes</p>
                </div>
              );
            }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={32}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}