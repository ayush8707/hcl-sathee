const VishistAttendance = require("../Models/VishistAttendance");
const User = require("../Models/User");
const { fail, ok, wrap } = require("../Utils/httpResponse");
const { isAdminRole, isVishistUser, matchesCentre } = require("../Utils/centreMatch");
const { MARK_WINDOW_DAYS, dueVisits, indiaDate, visitDateProblem } = require("../Utils/vishistVisits");

// Admins pick a Kendra; a SATHEE MITRA only ever works with their own.
const scopeCentre = (req, requested) =>
  isAdminRole(req.user?.role) ? requested || null : req.user?.centre || null;

exports.getVishistAttendance = wrap(
  async (req, res) => {
    const date = (req.query.date || "").trim();
    const from = (req.query.from || "").trim();
    const to = (req.query.to || "").trim();
    const centre = scopeCentre(req, req.query.centre);
    const status = req.query.status || null;

    let records;
    if (date) {
      records = await VishistAttendance.findByDate(date, centre, status);
    } else if (from && to) {
      records = await VishistAttendance.findByDateRange(from, to, centre, status);
    } else {
      return fail(res, 400, "Provide date=YYYY-MM-DD or from and to query params");
    }

    return ok(res, { records });
  },
  { label: "Get Vishist Attendance Error", message: "Failed to fetch Vishist attendance" }
);

/**
 * GET /api/vishist-attendance/due: the Vishist visits from the last
 * MARK_WINDOW_DAYS days that nobody has answered yet ("Did they come?").
 */
exports.getDueVisits = wrap(
  async (req, res) => {
    const centre = scopeCentre(req, req.query.centre);
    if (!centre) return ok(res, { visits: [] });

    const vishists = (await User.findVishists()).filter((v) => matchesCentre(v.centre, centre));
    const now = new Date();
    const records = await VishistAttendance.findForVishists(
      vishists.map((v) => v.id),
      indiaDate(now, MARK_WINDOW_DAYS - 1)
    );
    return ok(res, { visits: dueVisits({ vishists, records, now }) });
  },
  { label: "Due Vishist Visits Error", message: "Failed to load Vishist visits" }
);

/**
 * POST /api/vishist-attendance: the SATHEE MITRA answers for one visit day.
 * came=false records "didn't come"; otherwise topic and photo are optional.
 */
exports.markVishistAttendance = wrap(
  async (req, res) => {
    const vishistUserId = String(req.body.vishistUserId ?? "").trim();
    const date = String(req.body.date ?? "").trim();
    const came = !["false", "0", "no"].includes(String(req.body.came ?? "true").toLowerCase());
    if (!vishistUserId || !date) return fail(res, 400, "Choose the Vishist and the visit date");

    const dateProblem = visitDateProblem(date);
    if (dateProblem) return fail(res, 400, dateProblem);

    const vishistUser = await User.findById(vishistUserId);
    if (!vishistUser || !isVishistUser(vishistUser)) {
      return fail(res, 400, "Selected user is not a SATHEE Vishist");
    }
    if (!isAdminRole(req.user?.role) && !matchesCentre(vishistUser.centre, req.user?.centre)) {
      return fail(res, 403, "You can only record Vishists who visit your own Kendra");
    }

    // The login token has no name, so look up who is recording this.
    const marker = req.user?.id ? await User.findById(req.user.id) : null;

    try {
      const record = await VishistAttendance.create({
        vishistUserId,
        vishistName: vishistUser.name,
        vishistEmail: vishistUser.email,
        centre: vishistUser.centre,
        subject: String(req.body.subject ?? "").trim() || vishistUser.subject || null,
        topicTaught: String(req.body.topicTaught ?? "").trim(),
        date,
        came,
        file: req.file,
        markedByUserId: req.user?.id,
        markedByName: marker?.name || null,
      });
      return ok(res, {
        message: came ? "Vishist visit recorded" : "Recorded that the Vishist didn't come",
        record,
      });
    } catch (err) {
      if (err.status === 409) return fail(res, 409, err.message);
      throw err;
    }
  },
  { label: "Mark Vishist Attendance Error", message: "Failed to mark Vishist attendance" }
);

exports.approveVishistAttendance = wrap(
  async (req, res) => {
    try {
      const record = await VishistAttendance.approve(req.params.id, req.user?.id);
      return ok(res, { message: "Vishist attendance approved", record });
    } catch (err) {
      return fail(res, err.status || 400, err.message || "Unable to approve attendance");
    }
  },
  { label: "Approve Vishist Attendance Error", message: "Failed to approve Vishist attendance" }
);
