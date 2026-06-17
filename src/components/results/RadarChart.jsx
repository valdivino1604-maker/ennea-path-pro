import React from "react";
import { Radar, RadarChart as RChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import { TYPE_NAMES } from "@/lib/enneagramData";

export default function RadarChartComponent({ percentages }) {
  const data = Object.entries(percentages).map(([type, value]) => ({
    type: `T${type}`,
    fullName: TYPE_NAMES[parseInt(type)],
    value
  }));

  return (
    <div className="w-full h-[300px] sm:h-[380px]">
      <ResponsiveContainer width="100%" height="100%">
        <RChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="type"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
          />
          <Tooltip
            content={({ payload }) => {
              if (!payload || !payload[0]) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
                  <p className="text-sm font-semibold text-foreground">{d.fullName}</p>
                  <p className="text-xs text-primary font-medium">{d.value}%</p>
                </div>
              );
            }}
          />
          <Radar
            name="Pontuação"
            dataKey="value"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </RChart>
      </ResponsiveContainer>
    </div>
  );
}