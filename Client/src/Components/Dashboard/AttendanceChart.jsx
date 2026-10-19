import { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { SectionHeader } from "./SectionHeader";
import { fetchAttendanceSummary } from "../../services/dailySubjectAttendance";
import { getCentreValueFromPortal } from "../../utils/portalMapping";

const periodOptions = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
];

const COLORS = { present: "#3B82F6", absent: "#CBD5E1" };

export function AttendanceChart({ portalName, isCustomCentre = false }) {
  const [selectedPeriod, setSelectedPeriod] = useState("daily");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const centre = useMemo(() => getCentreValueFromPortal(portalName) || portalName || null, [portalName]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (isCustomCentre) {
        setSummary(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const data = await fetchAttendanceSummary({
          period: selectedPeriod,
          centre,
        });
        if (isMounted) setSummary(data);
      } catch (err) {
        console.error("Attendance summary error:", err);
        if (isMounted) setError("Unable to load attendance");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [selectedPeriod, centre, isCustomCentre]);

  const chartData = summary
    ? [
        { name: "Present", value: Math.max(0, Number(summary.presentCount) || 0), color: COLORS.present },
        { name: "Absent", value: Math.max(0, Number(summary.absentCount) || 0), color: COLORS.absent },
      ]
    : [];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm h-[420px] flex flex-col overflow-hidden">
      <SectionHeader title="Average Attendance - Centre" />

      <div className="flex flex-wrap gap-2">
        {periodOptions.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setSelectedPeriod(option.key)}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
              selectedPeriod === option.key
                ? "border-[#3B82F6] bg-[#3B82F6] text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 flex-1 flex items-center gap-6">
        {loading ? (
          <p className="w-full text-center text-sm text-slate-600">Loading…</p>
        ) : error ? (
          <p className="w-full text-center text-sm text-red-600">{error}</p>
        ) : !summary || summary.totalStudents === 0 ? (
          <p className="w-full text-center text-sm text-slate-500">No students to show yet.</p>
        ) : (Number(summary.presentCount) || 0) === 0 ? (
          <div className="w-full text-center">
            <p className="text-sm font-medium text-slate-700">
              {selectedPeriod === "daily"
                ? "Attendance not marked today"
                : `No attendance marked this ${selectedPeriod === "weekly" ? "week" : "month"}`}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {summary.totalStudents} student{summary.totalStudents === 1 ? "" : "s"} in this centre
            </p>
          </div>
        ) : (
          <>
            <div className="h-40 w-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    isAnimationActive={false}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {selectedPeriod} attendance
              </p>
              <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
                {Number(summary.percentage) || 0}%
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {summary.presentCount} of {summary.totalStudents} present
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}