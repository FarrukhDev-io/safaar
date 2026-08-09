"use client";

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { BookingTrend } from "@/types/admin";

interface BookingLineChartProps {
  data: BookingTrend[];
}

export default function BookingLineChart({ data }: BookingLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: "var(--text-muted)" }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "var(--text-muted)" }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            boxShadow: "var(--shadow-md)",
            fontSize: "13px",
            padding: "10px 14px",
          }}
          itemStyle={{ padding: "2px 0" }}
          labelStyle={{ fontWeight: 600, marginBottom: "4px", color: "var(--text-primary)" }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: "13px", paddingTop: "12px" }}
        />
        <Line
          type="monotone"
          dataKey="hotels"
          stroke="#1E3A5F"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, fill: "#1E3A5F", strokeWidth: 2, stroke: "white" }}
          name="Mehmonxona"
        />
        <Line
          type="monotone"
          dataKey="buses"
          stroke="#2ECC71"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, fill: "#2ECC71", strokeWidth: 2, stroke: "white" }}
          name="Mashina Ijarasi"
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
