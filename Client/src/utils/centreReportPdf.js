import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const MARGIN = 40;
const INK = [15, 23, 42];
const MUTED = [100, 116, 139];
const ACCENT = [29, 78, 216];
const HEAD_FILL = [30, 64, 175];

const ensureSpace = (doc, y, needed = 40) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - MARGIN) {
    doc.addPage();
    return MARGIN;
  }
  return y;
};

const setText = (doc, [r, g, b]) => doc.setTextColor(r, g, b);

const addSectionHeading = (doc, text, y, number) => {
  y = ensureSpace(doc, y, 34);
  doc.setFontSize(13);
  doc.setFont(undefined, "bold");
  setText(doc, INK);
  doc.text(`${number}. ${text}`, MARGIN, y);
  doc.setFont(undefined, "normal");
  return y + 16;
};

const addCourseHeading = (doc, text, y) => {
  y = ensureSpace(doc, y, 26);
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  setText(doc, ACCENT);
  doc.text(text, MARGIN, y);
  doc.setFont(undefined, "normal");
  setText(doc, INK);
  return y + 14;
};

const addSubHeading = (doc, text, y) => {
  y = ensureSpace(doc, y, 24);
  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  setText(doc, INK);
  doc.text(text, MARGIN, y);
  doc.setFont(undefined, "normal");
  return y + 12;
};

const addNote = (doc, text, y) => {
  y = ensureSpace(doc, y, 20);
  doc.setFontSize(9);
  setText(doc, MUTED);
  doc.text(text, MARGIN, y);
  setText(doc, INK);
  return y + 16;
};

const addLabel = (doc, text, y) => {
  y = ensureSpace(doc, y, 18);
  doc.setFontSize(9);
  doc.setFont(undefined, "italic");
  setText(doc, MUTED);
  doc.text(text, MARGIN, y);
  doc.setFont(undefined, "normal");
  setText(doc, INK);
  return y + 10;
};

const addTable = (doc, y, { head, body }) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  y = ensureSpace(doc, y, 40);
  autoTable(doc, {
    head: [head],
    body,
    startY: y,
    margin: { left: MARGIN, right: MARGIN, top: MARGIN },
    tableWidth: pageWidth - MARGIN * 2,
    styles: { fontSize: 8, cellPadding: 4, textColor: INK },
    headStyles: { fillColor: HEAD_FILL, textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });
  return doc.lastAutoTable.finalY + 16;
};

/** One "Managed by: Name (email · phone)" line per Sathee Mitra — no table. */
const addManagedByLine = (doc, y, mitra) => {
  y = ensureSpace(doc, y, 16);
  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  const label = "Managed by: ";
  doc.text(label, MARGIN, y);
  const labelWidth = doc.getTextWidth(label);
  doc.setFont(undefined, "normal");
  const details = [mitra.email, mitra.phone].filter(Boolean).join(" · ");
  doc.text(`${mitra.name || "—"}${details ? ` (${details})` : ""}`, MARGIN + labelWidth, y);
  return y + 14;
};

const addManagedBySection = (doc, y, rows) => {
  if (!rows.length) return addNote(doc, "No Sathee Mitra found for this centre.", y);
  for (const mitra of rows) y = addManagedByLine(doc, y, mitra);
  return y + 6;
};

/** "List of Sathee Vishist" — a small Name/Email table, no attendance figures. */
const addVishistSection = (doc, y, rows) => {
  y = addSubHeading(doc, "List of Sathee Vishist", y);
  if (!rows.length) return addNote(doc, "No Sathee Vishist found for this centre.", y);
  return addTable(doc, y, {
    head: ["Name", "Email"],
    body: rows.map((r) => [r.name || "—", r.email || "—"]),
  });
};

const CHART_HEIGHT = 90;
const CHART_LEFT_GUTTER = 24;
const MAX_CHART_LABELS = 8;

/** A simple vector line chart (0-100% y-axis) — no external charting library needed in the PDF. */
const addLineChart = (doc, y, { title, data }) => {
  y = ensureSpace(doc, y, CHART_HEIGHT + 40);
  doc.setFontSize(9);
  doc.setFont(undefined, "bold");
  setText(doc, INK);
  doc.text(title, MARGIN, y);
  doc.setFont(undefined, "normal");
  y += 10;

  if (!data.length) return addNote(doc, "No data to chart.", y);

  const pageWidth = doc.internal.pageSize.getWidth();
  const chartTop = y;
  const chartBottom = y + CHART_HEIGHT;
  const chartLeft = MARGIN + CHART_LEFT_GUTTER;
  const chartRight = pageWidth - MARGIN;
  const plotWidth = chartRight - chartLeft;

  doc.setFontSize(7);
  setText(doc, MUTED);
  doc.setDrawColor(226, 232, 240);
  [0, 25, 50, 75, 100].forEach((tick) => {
    const ty = chartBottom - (tick / 100) * CHART_HEIGHT;
    doc.line(chartLeft, ty, chartRight, ty);
    doc.text(`${tick}`, chartLeft - 4, ty + 2, { align: "right" });
  });

  const n = data.length;
  const xStep = n > 1 ? plotWidth / (n - 1) : 0;
  const points = data.map((d, i) => ({
    x: chartLeft + (n > 1 ? i * xStep : plotWidth / 2),
    y: chartBottom - (Math.max(0, Math.min(100, Number(d.percentage) || 0)) / 100) * CHART_HEIGHT,
  }));

  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(1.2);
  for (let i = 0; i < points.length - 1; i += 1) {
    doc.line(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
  }
  doc.setFillColor(37, 99, 235);
  points.forEach((p) => doc.circle(p.x, p.y, 1.4, "F"));
  doc.setLineWidth(0.5);

  const labelStep = Math.max(1, Math.ceil(n / MAX_CHART_LABELS));
  doc.setFontSize(6.5);
  setText(doc, MUTED);
  data.forEach((d, i) => {
    if (i % labelStep !== 0 && i !== n - 1) return;
    doc.text(String(d.label ?? ""), points[i].x, chartBottom + 10, { align: "center" });
  });
  setText(doc, INK);

  return Math.max(chartBottom, chartTop) + 22;
};

const marksTables = (doc, y, tables, fallbackLabel) => {
  tables.forEach((table, index) => {
    const label = table.test.name || `${fallbackLabel} ${index + 1}`;
    y = addLabel(doc, table.test.testDate ? `${label} — ${table.test.testDate}` : label, y);
    y = addTable(doc, y, {
      head: ["Student", ...table.subjects],
      body: table.rows.map((row) => [row.student.name, ...row.cells]),
    });
  });
  return y;
};

const pct = (value) => (value == null ? "—" : `${value}%`);
const code = (student) => student.studentId || student.enrollmentNo || student.id;

const delta = (value, previous, unit, prevLabel) => {
  if (value == null || previous == null) return "";
  const diff = Math.round((value - previous) * 10) / 10;
  if (diff === 0) return `same as ${prevLabel}`;
  return `${diff > 0 ? "+" : ""}${diff}${unit} vs ${prevLabel}`;
};

const addSummary = (doc, y, summary) =>
  addTable(doc, y, {
    head: ["Measure", "This period", "Change"],
    body: [
      ["Students in selected courses", summary.students, ""],
      ["New admissions", summary.newAdmissions, ""],
      ["Average attendance", pct(summary.avgAttendance), delta(summary.avgAttendance, summary.prevAttendance, " pts", summary.prevLabel)],
      ["Average test score", pct(summary.avgScore), delta(summary.avgScore, summary.prevScore, " pts", summary.prevLabel)],
      ["Tests held", summary.testsHeld, delta(summary.testsHeld, summary.prevTestsHeld, "", summary.prevLabel)],
      ["Students at risk (attendance < 75% or score < 35%)", summary.atRisk, ""],
    ],
  });

const addEngagement = (doc, y, overview) => {
  const { bands } = overview;
  y = addSubHeading(doc, "Attendance spread", y);
  y = addTable(doc, y, {
    head: ["90% or more", "75-89%", "Below 75%", "No attendance taken"],
    body: [[bands.high, bands.mid, bands.low, bands.none]],
  });

  y = addSubHeading(doc, "Students needing attention", y);
  y = overview.atRisk.length
    ? addTable(doc, y, {
        head: ["Student", "ID", "Course", "Reason"],
        body: overview.atRisk.map((r) => [r.student.name, code(r.student), r.student.courseCode, r.reasons.join(" · ")]),
      })
    : addNote(doc, "No students below the attendance or score thresholds.", y);

  y = addSubHeading(doc, "Low attendance and absence streaks", y);
  y = overview.lowAttendance.length
    ? addTable(doc, y, {
        head: ["Student", "Course", "Attendance", "Days present", "Longest absence (days)"],
        body: overview.lowAttendance.map((a) => [a.student.name, a.student.courseCode, `${a.percentage}%`, `${a.presentDays} / ${a.totalDays}`, a.longestAbsence]),
      })
    : addNote(doc, "Everyone with attendance records is at 75% or above.", y);

  y = addSubHeading(doc, "Top 5 students", y);
  y = overview.topStudents.length
    ? addTable(doc, y, { head: ["Student", "Course", "Avg score"], body: overview.topStudents.map((s) => [s.student.name, s.student.courseCode, `${s.score}%`]) })
    : addNote(doc, "No marks recorded in this period.", y);

  if (overview.bottomStudents.length) {
    y = addSubHeading(doc, "Bottom 5 students", y);
    y = addTable(doc, y, { head: ["Student", "Course", "Avg score"], body: overview.bottomStudents.map((s) => [s.student.name, s.student.courseCode, `${s.score}%`]) });
  }

  y = addSubHeading(doc, "Subject-wise average marks", y);
  return overview.subjectAverages.length
    ? addTable(doc, y, { head: ["Subject", "Marks entered", "Average"], body: overview.subjectAverages.map((s) => [s.subject, s.entries, `${s.average}%`]) })
    : addNote(doc, "No marks recorded in this period.", y);
};

const addActivity = (doc, y, activity) => {
  y = addSubHeading(doc, "Mentors", y);
  y = activity.mentorRows.length
    ? addTable(doc, y, {
        head: ["Name", "Role", "Days present", "Sessions taught", "Subjects"],
        body: activity.mentorRows.map((m) => [m.name, m.type, m.daysPresent, m.type === "Vishist" ? m.sessions : "—", m.subjects.join(", ") || "—"]),
      })
    : addNote(doc, "No Sathee Mitra or Vishist accounts in this centre.", y);

  y = addSubHeading(doc, "Centre activity", y);
  y = addTable(doc, y, {
    head: ["Item", "Count", "Detail"],
    body: [
      ["Vishist sessions", activity.vishistSessions, ""],
      ["Leave requests", activity.leaves.total, `${activity.leaves.approved} approved, ${activity.leaves.rejected} rejected, ${activity.leaves.pending} pending`],
      ["Queries raised", activity.queries.total, `${activity.queries.replied} replied, ${activity.queries.open} open`],
      ["Announcements", activity.announcements.total, activity.announcements.latest.join("; ")],
    ],
  });
  return y;
};

const addYearOverview = (doc, y, { monthlyTrend, perStudent, courses }) => {
  y = addLineChart(doc, y, { title: "Monthly Attendance", data: monthlyTrend.map((m) => ({ label: m.label, percentage: m.attendance ?? 0 })) });
  y = addLineChart(doc, y, { title: "Monthly Average Test Score", data: monthlyTrend.map((m) => ({ label: m.label, percentage: m.score ?? 0 })) });
  y = addTable(doc, y, { head: ["Month", "Attendance", "Avg test score"], body: monthlyTrend.map((m) => [m.label, pct(m.attendance), pct(m.score)]) });
  for (const course of courses) {
    y = addCourseHeading(doc, course, y);
    const rows = perStudent.filter((p) => p.student.courseCode === course);
    y = rows.length
      ? addTable(doc, y, {
          head: ["Student", "ID", "Attendance", "Avg score", "Tests taken"],
          body: rows.map((p) => [p.student.name, code(p.student), pct(p.attendance), pct(p.score), p.tests]),
        })
      : addNote(doc, "No students in this course.", y);
  }
  return y;
};

/**
 * Renders the same report shown on screen into a paginated PDF: Summary,
 * then per-course Performance and Attendance (or a Year overview for year
 * reports), Student engagement and Mentors & centre activity. Sathee Mitra /
 * Vishist contact lists are optionally added after the Summary.
 */
export const buildCentreReportPdf = ({
  centreValue,
  centreId,
  place,
  address,
  dateLabel,
  periodLabel, // "Weekly" | "Monthly" (controls the Pre-Mid tables)
  periodTitle, // e.g. "Oct 2026", "Academic year 2026–27"
  rangeLabel,
  isYear,
  summary,
  overview,
  monthlyTrend,
  activity,
  courses,
  performanceByCourse,
  attendanceByCourse,
  includeMitra,
  mitraRows,
  includeVishist,
  vishistRows,
}) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.setFont(undefined, "bold");
  setText(doc, INK);
  doc.text(`${String(periodTitle || periodLabel).toUpperCase()} REPORT — ${centreValue}`, pageWidth / 2, 50, {
    align: "center",
  });
  doc.setFont(undefined, "normal");

  let leftY = 78;
  doc.setFontSize(10);
  [
    `Centre: ${centreValue}`,
    `Kendra ID: ${centreId ?? "—"}`,
    `Place: ${place ?? "—"}`,
    `Address: ${address ?? "—"}`,
    `Period: ${rangeLabel ?? "—"}`,
  ].forEach((line) => {
    doc.text(line, MARGIN, leftY);
    leftY += 14;
  });
  doc.text(dateLabel, pageWidth - MARGIN, 78, { align: "right" });

  let y = leftY + 14;
  doc.setDrawColor(226, 232, 240);
  doc.line(MARGIN, y - 12, pageWidth - MARGIN, y - 12);

  let headingNumber = 1;

  if (summary) {
    y = addSectionHeading(doc, "Summary", y, headingNumber++);
    y = addSummary(doc, y, summary);
  }

  if (includeMitra) {
    y = addSectionHeading(doc, "Sathee Mitra", y, headingNumber++);
    y = addManagedBySection(doc, y, mitraRows) + 4;
  }

  if (includeVishist) {
    y = addSectionHeading(doc, "Sathee Vishist", y, headingNumber++);
    y = addVishistSection(doc, y, vishistRows) + 4;
  }

  if (isYear) {
    y = addSectionHeading(doc, "Year overview", y, headingNumber++);
    y = addYearOverview(doc, y, { monthlyTrend: monthlyTrend || [], perStudent: overview?.perStudent || [], courses });
  } else {
    y = addSectionHeading(doc, "Performance", y, headingNumber++);
    for (const course of courses) {
      y = addCourseHeading(doc, course, y);
      const perf = performanceByCourse[course];

      y = addLineChart(doc, y, { title: "Average Score Trend", data: perf.trend || [] });

      y = addSubHeading(doc, "Performance Test", y);
      y = perf.performance.length
        ? marksTables(doc, y, perf.performance, "Week")
        : addNote(doc, "No performance tests recorded for this period.", y);

      if (periodLabel === "Monthly") {
        y = addSubHeading(doc, "Pre-Mid Test", y);
        y = perf.preMid.length
          ? marksTables(doc, y, perf.preMid, "Pre-Mid Test")
          : addNote(doc, "No pre-mid test recorded for this period.", y);
      }
      y += 4;
    }

    y = addSectionHeading(doc, "Attendance", y, headingNumber++);
    for (const course of courses) {
      y = addCourseHeading(doc, course, y);
      const courseAttendance = attendanceByCourse[course] || { rows: [], trend: [] };
      const rows = courseAttendance.rows || [];

      y = addLineChart(doc, y, { title: "Daily Attendance Trend", data: courseAttendance.trend || [] });

      y = rows.length
        ? addTable(doc, y, {
            head: ["Student", "Student ID", "Attendance %"],
            body: rows.map((r) => [
              r.student.name,
              r.student.studentId || r.student.enrollmentNo || r.student.id,
              `${r.percentage}%`,
            ]),
          })
        : addNote(doc, "No students in this course.", y);
      y += 4;
    }
  }

  if (overview) {
    y = addSectionHeading(doc, "Student engagement", y, headingNumber++);
    y = addEngagement(doc, y, overview);
  }

  if (activity) {
    y = addSectionHeading(doc, "Mentors & centre activity", y, headingNumber);
    addActivity(doc, y, activity);
  }

  return doc;
};
