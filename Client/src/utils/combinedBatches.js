import { normalizeCourseCode } from "./courseSubjects";

/**
 * Courses taught together. IBPS and RRB have few students and the same
 * content as SSC, so they sit the SSC classes: an "SSC – Quantitative
 * Aptitude" class also lists the IBPS and RRB students who study it.
 * Their own IBPS / RRB classes (e.g. Computer Knowledge) are unchanged.
 */
export const COMBINED_BATCHES = {
  SSC: ["IBPS", "RRB"],
};

// Where a course names the same subject differently from the class it joins.
// Keys are the SSC subject (lower case); values are that course's name.
const SUBJECT_EQUIVALENTS = {
  RRB: {
    "quantitative aptitude": "Mathematics",
    "reasoning ability": "General Intelligence & Reasoning",
  },
};

const norm = (value = "") => String(value || "").trim().toLowerCase().replace(/\s+/g, " ");

const studentSubjects = (student) =>
  Array.isArray(student?.subjects) && student.subjects.length
    ? student.subjects
    : Object.keys(student?.attendance || {});

/** The student's own name for `subject`, or null if they don't study it. */
const ownSubject = (student, subject) =>
  studentSubjects(student).find((s) => norm(s) === norm(subject)) || null;

/**
 * Whether a student belongs in a timetable class, and under which of their
 * own subjects their attendance is saved. Returns the subject name (e.g.
 * "Mathematics" for an RRB student in SSC "Quantitative Aptitude"), or null.
 */
export const classSubjectFor = (student, classItem) => {
  const subject = norm(classItem?.subject);
  if (!subject) return null;

  const classCourse = normalizeCourseCode(classItem.course);
  const studentCourse = normalizeCourseCode(student?.course);
  if (!classCourse || classCourse === studentCourse) return ownSubject(student, classItem.subject);

  if (!(COMBINED_BATCHES[classCourse] || []).includes(studentCourse)) return null;
  const theirName = SUBJECT_EQUIVALENTS[studentCourse]?.[subject] || classItem.subject;
  return ownSubject(student, theirName);
};

/** Courses that join `course` classes, e.g. SSC -> ["IBPS", "RRB"]. */
export const joiningCourses = (course) => COMBINED_BATCHES[normalizeCourseCode(course)] || [];
