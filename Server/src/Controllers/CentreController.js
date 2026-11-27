const Centre = require("../Models/Centre");
const { getSupabase, assertNoError, selectAllRows } = require("../config/supabase");
const { fail, ok, wrap } = require("../Utils/httpResponse");
const {
  getCanonicalCentreKey,
  isSatheeMitraRole,
  isHclPartnerRole,
  isVishistUser,
} = require("../Utils/centreMatch");

exports.getCentres = wrap(
  async (_req, res) => {
    const centres = await Centre.findAll();
    return ok(res, { centres });
  },
  { label: "Get Centres Error", message: "Failed to fetch centres" }
);

/**
 * Per-centre headcounts for the admin "Other Centres" page: students, Sathee
 * Mitras (non-Vishist), Sathee Vishists, and HCL Partners assigned to each
 * centre. One pass over `users` + `students`, matched with the shared fuzzy key.
 */
exports.getCentresOverview = wrap(
  async (_req, res) => {
    const supabase = getSupabase();
    // Paged: a single request stops at 1000 rows, which would undercount.
    const [centres, userRows, students] = await Promise.all([
      Centre.findAll(),
      selectAllRows(
        () => supabase.from("users").select("id, role, centre, is_vishist"),
        "Failed to load users for centres overview"
      ),
      selectAllRows(
        () => supabase.from("students").select("id, centre"),
        "Failed to load students for centres overview"
      ),
    ]);

    const users = userRows.map((row) => ({
      role: row.role,
      centre: row.centre,
      isVishist: row.is_vishist,
    }));

    const overview = centres.map((centre) => {
      const key = getCanonicalCentreKey(centre.name);
      const inCentre = (doc) => getCanonicalCentreKey(doc.centre) === key;

      const centreUsers = users.filter(inCentre);

      return {
        id: centre.id,
        name: centre.name,
        isDefault: String(centre.id).startsWith("default:"),
        counts: {
          students: students.filter(inCentre).length,
          satheeMitra: centreUsers.filter((u) => isSatheeMitraRole(u.role) && !isVishistUser(u)).length,
          satheeVishist: centreUsers.filter(isVishistUser).length,
          hclPartner: centreUsers.filter((u) => isHclPartnerRole(u.role)).length,
        },
      };
    });

    return ok(res, { centres: overview });
  },
  { label: "Centres Overview Error", message: "Failed to load the centres overview" }
);

exports.createCentre = wrap(
  async (req, res) => {
    try {
      const centre = await Centre.create(req.body?.name, req.user?.id);
      return ok(res, 201, { message: "Centre created successfully", centre });
    } catch (error) {
      if (error.code === "INVALID_CENTRE" || error.code === "DUPLICATE_CENTRE") {
        return fail(res, 400, error.message);
      }
      throw error;
    }
  },
  { label: "Create Centre Error", message: "Failed to create centre" }
);

exports.updateCentre = wrap(
  async (req, res) => {
    try {
      const centre = await Centre.update(req.params.id, req.body?.name);
      return ok(res, { message: "Centre renamed", centre });
    } catch (err) {
      return fail(res, 400, err.message);
    }
  },
  { label: "Update Centre Error", message: "Failed to rename centre" }
);

exports.deleteCentre = wrap(
  async (req, res) => {
    try {
      await Centre.remove(req.params.id);
      return ok(res, { message: "Centre deleted" });
    } catch (err) {
      return fail(res, 400, err.message);
    }
  },
  { label: "Delete Centre Error", message: "Failed to delete centre" }
);

