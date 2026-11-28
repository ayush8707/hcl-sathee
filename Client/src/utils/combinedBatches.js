import { normalizeCourseCode } from "./courseSubjects";

/**
 * Courses taught together, so one class lists everyone in the room and the
 * SATHEE MITRA marks it with one Save. Each student's mark is still saved
 * under their own course and subject.
 *
 *  - IBPS and RRB have few students and the same content as SSC, so they
 *    sit the SSC classes (one way: an IBPS class doesn't pull in SSC).
 *  - JEE, NEET and ICAR share Physics and Chemistry (and Mathematics or
 *    Biology with ICAR), so a class for any of them lists all three.
 *
 * A course only joins when that day's timetable has no class of its own for
 * the subject (otherwise its students would show up in both), and only the
 * first class that day that could take it.
 */
const JOINS = {
  SSC: ["IBPS", "RRB"],
  JEE: ["NEET", "ICAR"],
  NEET: ["JEE", "ICAR"],
  ICAR: ["JEE", "NEET"],
};

// Where a course names the same subject differently from the class it joins.
// Keys are the class's subject (lower case); values are that course's name.
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

/** `course`'s name for a class subject, e.g. RRB for "Quantitative Aptitude". */
const subjectNameFor = (course, subject) => SUBJECT_EQUIVALENTS[course]?.[norm(subject)] || subject;

/**
 * Whether a student belongs in a timetable class, and under which of their
 * own subjects their attendance is saved. Returns the subject name (e.g.
 * "Mathematics" for an RRB student in SSC "Quantitative Aptitude"), or null.
 * `dayClasses` is every class on the timetable that day.
 */
export const classSubjectFor = (student, classItem, dayClasses = []) => {
  if (!norm(classItem?.subject)) return null;

  const classCourse = normalizeCourseCode(classItem.course);
  const studentCourse = normalizeCourseCode(student?.course);
  if (!classCourse || classCourse === studentCourse) return ownSubject(student, classItem.subject);

  if (!(JOINS[classCourse] || []).includes(studentCourse)) return null;
  const theirName = subjectNameFor(studentCourse, classItem.subject);

  // Their course has its own class for this subject today: they go there.
  const hasOwnClass = dayClasses.some(
    (other) => normalizeCourseCode(other.course) === studentCourse && norm(other.subject) === norm(theirName)
  );
  if (hasOwnClass) return null;

  // Several classes could take them (JEE Physics and NEET Physics both today,
  // ICAR has none): they sit the first one, so they aren't listed twice.
  const sameClass = (a, b) =>
    a === b ||
    (normalizeCourseCode(a.course) === normalizeCourseCode(b.course) &&
      norm(a.subject) === norm(b.subject) &&
      String(a.time || "") === String(b.time || ""));
  const firstHost = dayClasses.find(
    (other) =>
      (JOINS[normalizeCourseCode(other.course)] || []).includes(studentCourse) &&
      norm(subjectNameFor(studentCourse, other.subject)) === norm(theirName)
  );
  if (firstHost && !sameClass(firstHost, classItem)) return null;

  return ownSubject(student, theirName);
};
