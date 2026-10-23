import { useMemo, useState } from "react";
import { AlertCircle, Check, Info, Lock, UserPlus, X } from "lucide-react";
import { getCentreValueFromPortal } from "../../utils/portalMapping";
import { getCentreId } from "../../utils/centreDirectory";
import { useEscapeToClose } from "../../hooks/useEscapeToClose";
import { courseTone } from "../../utils/courseStyles";
import {
  buildMarksAndAttendance,
  getCourseSubjectConfig,
  validateSubjectSelection,
} from "../../utils/courseSubjects";
import {
  isOptionalPhone10,
  isValidPhone10,
  sanitizePhoneInput,
} from "../../utils/phone";

const courses = ["JEE", "NEET", "CLAT", "SSC", "IBPS", "RRB", "ICAR", "CUET"];
const casteCategories = ["General", "OBC", "SC", "ST", "EWS"];
const genders = ["Male", "Female", "Other"];

const inputBase =
  "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:outline-none focus:ring-4";
const inputClass = `${inputBase} border-slate-300 focus:border-blue-500 focus:ring-blue-100`;
const invalidClass = `${inputBase} border-red-400 focus:border-red-500 focus:ring-red-100`;

const createEmptyForm = (centre) => ({
  studentId: "",
  firstName: "",
  lastName: "",
  gender: "Male",
  email: "",
  phone: "",
  centreName: centre,
  centreId: centre,
  course: "JEE",
  category: "General",
  fatherName: "",
  fatherPhone: "",
  motherName: "",
  motherPhone: "",
  address: "",
});

export default function NewStudent({ open, onClose, onSubmit, error, submitting, portalName }) {
  const defaultCentre = getCentreValueFromPortal(portalName) || "HCL RAJASTHAN";
  const kendraId = getCentreId(portalName);
  const [form, setForm] = useState(() => createEmptyForm(defaultCentre));
  const [choiceSubjects, setChoiceSubjects] = useState([]);
  const [subjectError, setSubjectError] = useState("");
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  useEscapeToClose(onClose, open);

  const subjectConfig = useMemo(() => getCourseSubjectConfig(form.course), [form.course]);

  const selectedSubjects = useMemo(() => {
    if (!subjectConfig) return [];
    return [...subjectConfig.compulsory, ...choiceSubjects];
  }, [subjectConfig, choiceSubjects]);

  const { marks, attendance } = useMemo(
    () => buildMarksAndAttendance(selectedSubjects),
    [selectedSubjects]
  );

  if (!open) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: "" } : prev));
    if (field === "course" && value !== form.course) {
      setChoiceSubjects([]);
      setSubjectError("");
    }
  };

  const toggleChoiceSubject = (subject) => {
    if (!subjectConfig || subjectConfig.choiceMode === "none") return;

    setSubjectError("");
    setChoiceSubjects((prev) => {
      const isSelected = prev.includes(subject);

      if (subjectConfig.choiceMode === "exactlyOne") {
        return isSelected ? [] : [subject];
      }

      if (isSelected) {
        return prev.filter((item) => item !== subject);
      }

      if (prev.length >= subjectConfig.maxChoice) {
        setSubjectError(
          `You can select at most ${subjectConfig.maxChoice} optional subject${
            subjectConfig.maxChoice === 1 ? "" : "s"
          }.`
        );
        return prev;
      }

      return [...prev, subject];
    });
  };

  const validate = () => {
    const errors = {};
    if (!form.firstName.trim()) errors.firstName = "First name is required";
    if (!form.email.trim()) errors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = "Enter a valid email address";
    if (!isValidPhone10(form.phone)) errors.phone = "Enter a 10-digit mobile number";
    if (!isOptionalPhone10(form.fatherPhone)) errors.fatherPhone = "Must be 10 digits or left blank";
    if (!isOptionalPhone10(form.motherPhone)) errors.motherPhone = "Must be 10 digits or left blank";
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setFormError("Please fix the highlighted fields.");
      return;
    }

    const validation = validateSubjectSelection(form.course, selectedSubjects);
    if (!validation.ok) {
      setSubjectError(validation.message);
      return;
    }

    const payload = {
      ...form,
      phone: form.phone,
      fatherPhone: form.fatherPhone || "",
      motherPhone: form.motherPhone || "",
      subjects: selectedSubjects,
      marks,
      attendance,
    };

    if (!(await onSubmit?.(payload))) return;
    setForm(createEmptyForm(defaultCentre));
    setChoiceSubjects([]);
    setSubjectError("");
    setFormError("");
    setFieldErrors({});
    onClose();
  };

  const bannerError = error || formError;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-student-title"
        className="flex h-full w-full max-w-3xl flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <UserPlus size={20} />
            </span>
            <div>
              <h2 id="new-student-title" className="text-lg font-semibold text-slate-900">
                Add new student
              </h2>
              <p className="text-sm text-slate-500">
                Fields marked <span className="text-red-500">*</span> are required.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-8 overflow-y-auto px-5 py-6 sm:px-7">
            {bannerError ? (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{bannerError}</span>
              </div>
            ) : null}

            <Section step={1} title="Personal details" description="Basic information about the student.">
              <Field
                label="First name"
                required
                value={form.firstName}
                onChange={(v) => handleChange("firstName", v)}
                placeholder="e.g. Aarav"
                error={fieldErrors.firstName}
                autoComplete="given-name"
              />
              <Field
                label="Last name"
                value={form.lastName}
                onChange={(v) => handleChange("lastName", v)}
                placeholder="e.g. Sharma"
                autoComplete="family-name"
              />
              <div>
                <Label required>Gender</Label>
                <div className="grid grid-cols-3 gap-2">
                  {genders.map((g) => {
                    const active = form.gender === g;
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => handleChange("gender", g)}
                        aria-pressed={active}
                        className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                          active
                            ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-100"
                            : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"
                        }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>
              <SelectField
                label="Category"
                value={form.category}
                options={casteCategories}
                onChange={(v) => handleChange("category", v)}
              />
            </Section>

            <Section step={2} title="Course & subjects" description="Choose the batch the student is joining.">
              <div className="sm:col-span-2">
                <Label required>Course</Label>
                <div className="flex flex-wrap gap-2">
                  {courses.map((c) => {
                    const active = form.course === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleChange("course", c)}
                        aria-pressed={active}
                        className={`rounded-full px-4 py-1.5 text-sm font-semibold ring-1 ring-inset transition ${
                          active
                            ? `${courseTone(c)} ring-2 shadow-sm`
                            : "bg-white text-slate-600 ring-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {subjectConfig ? (
                <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                  <p className="mb-3 text-sm text-slate-600">{subjectConfig.hint}</p>
                  <div className="flex flex-wrap gap-2">
                    {subjectConfig.compulsory.map((subject) => (
                      <span
                        key={subject}
                        title="Compulsory subject"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700"
                      >
                        <Lock size={13} className="text-slate-400" />
                        {subject}
                      </span>
                    ))}
                  </div>

                  {subjectConfig.choice.length > 0 ? (
                    <div className="mt-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Optional · {choiceSubjects.length}/
                        {subjectConfig.choiceMode === "exactlyOne" ? 1 : subjectConfig.maxChoice} selected
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {subjectConfig.choice.map((subject) => {
                          const active = choiceSubjects.includes(subject);
                          return (
                            <button
                              key={subject}
                              type="button"
                              onClick={() => toggleChoiceSubject(subject)}
                              aria-pressed={active}
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                                active
                                  ? "border-blue-500 bg-blue-600 text-white"
                                  : "border-slate-300 bg-white text-slate-700 hover:border-blue-400"
                              }`}
                            >
                              {active ? <Check size={14} /> : null}
                              {subject}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {subjectError ? (
                    <p className="mt-3 flex items-center gap-1.5 text-sm text-red-600">
                      <AlertCircle size={15} /> {subjectError}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </Section>

            <Section step={3} title="Contact details" description="Used for notices and login invitations.">
              <Field
                label="Email address"
                required
                type="email"
                value={form.email}
                onChange={(v) => handleChange("email", v)}
                placeholder="name@example.com"
                error={fieldErrors.email}
                autoComplete="email"
              />
              <PhoneField
                label="Mobile number"
                required
                value={form.phone}
                onChange={(v) => handleChange("phone", v)}
                error={fieldErrors.phone}
              />
              <div className="sm:col-span-2">
                <Label>Address</Label>
                <textarea
                  rows={2}
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="House no., street, village / city, district"
                  className={`${inputClass} resize-none`}
                />
              </div>
            </Section>

            <Section step={4} title="Parent / guardian" description="Optional, but helpful for follow-ups.">
              <Field
                label="Father's name"
                value={form.fatherName}
                onChange={(v) => handleChange("fatherName", v)}
                placeholder="Full name"
              />
              <PhoneField
                label="Father's mobile"
                value={form.fatherPhone}
                onChange={(v) => handleChange("fatherPhone", v)}
                error={fieldErrors.fatherPhone}
              />
              <Field
                label="Mother's name"
                value={form.motherName}
                onChange={(v) => handleChange("motherName", v)}
                placeholder="Full name"
              />
              <PhoneField
                label="Mother's mobile"
                value={form.motherPhone}
                onChange={(v) => handleChange("motherPhone", v)}
                error={fieldErrors.motherPhone}
              />
            </Section>

            <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              <Info size={18} className="mt-0.5 shrink-0" />
              <p>
                The Student ID is created automatically
                {kendraId ? (
                  <>
                    {" "}
                    (e.g. <span className="font-mono font-semibold">{kendraId}-001</span>)
                  </>
                ) : null}
                . Marks and attendance start at 0 and update from tests and daily classes.
              </p>
            </div>
          </div>

          {/* Footer stays visible while the form scrolls */}
          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:px-7">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <UserPlus size={16} />
              )}
              {submitting ? "Adding student…" : "Add student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({ step, title, description, children }) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
          {step}
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Label({ children, required = false, htmlFor }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700">
      {children}
      {required ? <span className="ml-0.5 text-red-500">*</span> : null}
    </label>
  );
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-red-600">{message}</p>;
}

function Field({ label, value, onChange, placeholder, type = "text", required = false, error, autoComplete }) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        onChange={(e) => onChange?.(e.target.value)}
        className={error ? invalidClass : inputClass}
      />
      <FieldError message={error} />
    </div>
  );
}

function PhoneField({ label, value, onChange, required = false, error }) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <div className="flex">
        <span className="inline-flex items-center rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 px-3 text-sm text-slate-500">
          +91
        </span>
        <input
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={value}
          placeholder="98765 43210"
          aria-invalid={Boolean(error)}
          onChange={(e) => onChange(sanitizePhoneInput(e.target.value))}
          className={`${error ? invalidClass : inputClass} rounded-l-none`}
        />
      </div>
      <FieldError message={error} />
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <div>
      <Label>{label}</Label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        {options.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
    </div>
  );
}
