const User = require("../Models/User");
const { sendWelcomeEmail } = require("../Utils/sendEmail");
const { createPasswordLink } = require("../Utils/createPasswordLink");
const { fail, ok, wrap } = require("../Utils/httpResponse");
const {
  isValidCentre,
  filterByUserCentre,
  matchesCentre,
  isAdminRole,
  isHclPartnerRole,
  isSatheeMitraRole,
} = require("../Utils/centreMatch");
const { digitsOnly, isValidPhone10, normalizePhone10 } = require("../Utils/phone");
const Centre = require("../Models/Centre");
const {
  MAX_USER_IMPORT_ROWS,
  normalizeImportRole,
  resolveImportCentre,
} = require("../Utils/userImport");

const VALID_ROLES = ["ADMIN", "SATHEE MITRA", "HCL PARTNER"];
const TEST_EMAIL_DOMAIN = "@example.com";
const isMitra = (role) => String(role).toUpperCase() === "SATHEE MITRA";

const formatEmailError = (err) => {
  const oauthError =
    err?.response?.data?.error_description ||
    err?.response?.data?.error?.message ||
    (typeof err?.response?.data?.error === "string" ? err.response.data.error : null);

  const raw = oauthError || err?.message || "Failed to send welcome email";
  // Google answers an expired/revoked refresh token with
  // { error: "invalid_grant", error_description: "Bad Request" }, so check the
  // error code too, not just the description.
  const oauthCode =
    typeof err?.response?.data?.error === "string" ? err.response.data.error : "";
  if (`${oauthCode} ${raw}`.toLowerCase().includes("invalid_grant")) {
    return "Gmail authorization expired (invalid_grant). Update EMAIL_REFRESH_TOKEN on the server.";
  }
  return raw;
};
const toPublicUser = (user) => {
  if (!user) return user;
  const { password, ...safe } = user;
  return { ...safe, hasPassword: Boolean(password) };
};

exports.getUsers = wrap(
  async (req, res) => {
    const usersPage = await User.findAll({
      limit: req.query.limit,
      cursor: req.query.cursor,
    });
    let users = usersPage;

    if (isAdminRole(req.user?.role)) {
      users = users;
    } else if (isHclPartnerRole(req.user?.role) || isSatheeMitraRole(req.user?.role)) {
      users = filterByUserCentre(users, req.user).filter((user) =>
        isMitra(user.role)
      );
    } else {
      users = [];
    }

    return ok(res, { users: users.map(toPublicUser), nextCursor: usersPage.nextCursor });
  },
  { label: "Get Users Error", message: "Failed to fetch users" }
);

exports.getAdminUsers = wrap(
  async (req, res) => {
    const usersPage = await User.findAll({
      limit: req.query.limit,
      cursor: req.query.cursor,
    });
    const users = usersPage;
    const admins = users.filter((user) => isAdminRole(user.role));
    return ok(res, { users: admins.map(toPublicUser), nextCursor: usersPage.nextCursor });
  },
  { label: "Get Admin Users Error", message: "Failed to fetch admin users" }
);

exports.getMe = wrap(
  async (req, res) => {
    const user = await User.findById(req.user?.id);
    if (!user) {
      return fail(res, 404, "User not found");
    }
    return ok(res, { user: toPublicUser(user) });
  },
  { label: "Get Me Error", message: "Failed to fetch current user" }
);

exports.getVishistMentors = wrap(
  async (req, res) => {
    const allUsers = await User.findAll();
    const isAdmin = isAdminRole(req.user?.role);
    const centre = isAdmin ? req.query.centre || null : req.user?.centre;

    let mentors = allUsers.filter(
      (u) => isSatheeMitraRole(u.role) && Boolean(u.isVishist)
    );
    if (centre) {
      mentors = mentors.filter((u) => matchesCentre(u.centre, centre));
    }

    return ok(res, {
      mentors: mentors.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        centre: u.centre,
        availableDays: u.availableDays || [],
      })),
    });
  },
  { label: "Get Vishist Mentors Error", message: "Failed to fetch Vishist mentors" }
);

exports.savePushSubscription = wrap(
  async (req, res) => {
    const subscription = req.body?.subscription;
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return fail(res, 400, "A valid push subscription is required");
    }
    await User.addPushSubscription(req.user?.id, subscription);
    return ok(res, { message: "Device registered for notifications" });
  },
  { label: "Save Push Subscription Error", message: "Failed to save device subscription" }
);

exports.removePushSubscription = wrap(
  async (req, res) => {
    const endpoint = String(req.body?.endpoint || "").trim();
    if (!endpoint) return fail(res, 400, "endpoint is required");
    await User.removePushSubscription(req.user?.id, endpoint);
    return ok(res, { message: "Device unregistered from notifications" });
  },
  { label: "Remove Push Subscription Error", message: "Failed to remove device subscription" }
);

/**
 * Creates one invited user and sends the welcome email. Shared by "Add user"
 * and "Import users from Excel" so both follow the same rules. Returns
 * { ok: true, user, emailSent, emailError, passwordSetupLink } or
 * { ok: false, status, message }.
 */
const createUserRecord = async ({ name, email, phone, role, centre, availableDays, isVishist }) => {
  if (!name || !email || !phone || !role) {
    return { ok: false, status: 400, message: "Name, email, phone number and role are required" };
  }
  if (!isValidPhone10(phone)) {
    return { ok: false, status: 400, message: "Phone number must be exactly 10 digits" };
  }
  if (!VALID_ROLES.includes(role)) {
    return { ok: false, status: 400, message: "Invalid role selected" };
  }

  const normalizedName = String(name).trim();
  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedPhone = normalizePhone10(phone);
  const normalizedCentre = String(centre ?? "").trim() || null;
  const normalizedDays = User.normalizeAvailableDays(availableDays);

  if (!normalizedCentre) {
    return { ok: false, status: 400, message: "Centre is required" };
  }
  if (!(await isValidCentre(normalizedCentre))) {
    return { ok: false, status: 400, message: "Invalid centre selected" };
  }

  // Made before saving, so a failure here never leaves a half-added user.
  const passwordSetupLink = createPasswordLink(normalizedName, normalizedEmail, role);

  let createdUser;
  try {
    createdUser = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      role,
      centre: normalizedCentre,
      availableDays: isMitra(role) ? normalizedDays : [],
      ...(isMitra(role) ? { isVishist: Boolean(isVishist) } : {}),
      password: null,
    });
  } catch (error) {
    if (error.code === "DUPLICATE_EMAIL" || error.code === "DUPLICATE_PHONE") {
      return { ok: false, status: 409, message: error.message };
    }
    throw error;
  }

  let emailSent = false;
  let emailError = null;

  if (normalizedEmail.endsWith(TEST_EMAIL_DOMAIN)) {
    emailError = "Skipped welcome email for @example.com addresses";
  } else {
    try {
      await sendWelcomeEmail(normalizedEmail, normalizedName, role, normalizedCentre);
      emailSent = true;
    } catch (err) {
      emailError = formatEmailError(err);
      console.error("Welcome email failed:", emailError, err);
    }
  }

  return {
    ok: true,
    user: createdUser,
    emailSent,
    emailError,
    passwordSetupLink: emailSent ? null : passwordSetupLink,
  };
};

exports.addUser = wrap(
  async (req, res) => {
    const result = await createUserRecord(req.body || {});
    if (!result.ok) return fail(res, result.status, result.message);

    return ok(res, 201, {
      message: result.emailSent
        ? "User created successfully. Welcome email sent."
        : "User created successfully, but welcome email could not be sent.",
      emailSent: result.emailSent,
      emailError: result.emailError,
      passwordSetupLink: result.passwordSetupLink,
      user: toPublicUser(result.user),
    });
  },
  { label: "Add User Error", message: "Failed to create user" }
);

/**
 * POST /api/users/import { users: [...], defaultCentre }
 * Adds many SATHEE MITRAs / partners from an Excel sheet and sends each an
 * invite. Every row is checked on its own: good rows are added, bad rows are
 * reported with the reason, and nothing stops the rest of the sheet.
 */
exports.importUsers = wrap(
  async (req, res) => {
    const rows = Array.isArray(req.body?.users) ? req.body.users : null;
    if (!rows || !rows.length) return fail(res, 400, "No user rows were provided");
    if (rows.length > MAX_USER_IMPORT_ROWS) {
      return fail(
        res,
        400,
        `Too many rows in one import (max ${MAX_USER_IMPORT_ROWS}). Split the sheet and try again.`
      );
    }

    const centres = await Centre.findAll();
    const seenEmails = new Set();
    const seenPhones = new Set();
    const results = [];
    let created = 0;
    let emailsSent = 0;

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i] || {};
      const rowNo = Number(row.__row) || i + 2;
      const email = String(row.email ?? "").trim().toLowerCase();
      const phone = digitsOnly(row.phone);
      const report = (fields) => results.push({ row: rowNo, name: String(row.name ?? "").trim(), email, ...fields });

      const role = normalizeImportRole(row.role);
      if (!role) {
        report({ ok: false, message: "Role must be SATHEE MITRA or Partner" });
        continue;
      }
      const centre = resolveImportCentre(row.kendra, centres, req.body?.defaultCentre);
      if (!centre) {
        report({
          ok: false,
          message: row.kendra
            ? `Unknown Kendra "${String(row.kendra).trim()}". Use a Kendra ID like UK-DN-01.`
            : "Kendra is required",
        });
        continue;
      }
      if (email && seenEmails.has(email)) {
        report({ ok: false, message: "Same email appears earlier in the sheet" });
        continue;
      }
      if (phone && seenPhones.has(phone)) {
        report({ ok: false, message: "Same phone number appears earlier in the sheet" });
        continue;
      }

      try {
        const result = await createUserRecord({ ...row, role, centre, email, phone });
        if (!result.ok) {
          report({ ok: false, message: result.message });
          continue;
        }
        created += 1;
        if (result.emailSent) emailsSent += 1;
        if (email) seenEmails.add(email);
        if (phone) seenPhones.add(phone);
        report({
          ok: true,
          role,
          centre,
          emailSent: result.emailSent,
          emailError: result.emailError,
          passwordSetupLink: result.passwordSetupLink,
        });
      } catch (err) {
        console.error(`Import Users: row ${rowNo} failed`, err);
        report({ ok: false, message: err.message || "Failed to add this row" });
      }
    }

    return ok(res, {
      total: results.length,
      created,
      failed: results.length - created,
      emailsSent,
      results,
    });
  },
  { label: "Import Users Error", message: "Failed to import users" }
);

exports.resendInvite = wrap(
  async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return fail(res, 404, "User not found");
    if (user.password) {
      return fail(res, 400, "This user has already set their password");
    }

    const passwordSetupLink = createPasswordLink(user.name, user.email, user.role);

    if (user.email.endsWith(TEST_EMAIL_DOMAIN)) {
      return ok(res, {
        message: "Skipped resend for @example.com address",
        emailSent: false,
        passwordSetupLink,
      });
    }

    try {
      await sendWelcomeEmail(user.email, user.name, user.role, user.centre);
      return ok(res, { message: "Invite resent successfully", emailSent: true });
    } catch (err) {
      const emailError = formatEmailError(err);
      console.error("Resend invite failed:", emailError, err);
      return fail(res, 502, emailError);
    }
  },
  { label: "Resend Invite Error", message: "Failed to resend invite" }
);

exports.updateCurrentUser = wrap(
  async (req, res) => {
    const { name, email, phone } = req.body;
    const current = await User.findById(req.user?.id);

    if (!current) {
      return fail(res, 404, "User not found");
    }

    const patch = {};

    if (name != null) {
      const trimmedName = String(name).trim();
      if (!trimmedName) {
        return fail(res, 400, "Name is required");
      }
      patch.name = trimmedName;
    }

    if (email != null) {
      const normalizedEmail = String(email).trim().toLowerCase();
      if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return fail(res, 400, "Please enter a valid email address");
      }

      if (normalizedEmail !== current.email) {
        const existing = await User.findByEmail(normalizedEmail);
        if (existing && String(existing.id) !== String(req.user.id)) {
          return fail(res, 409, "Email already exists");
        }
      }
      patch.email = normalizedEmail;
    }

    if (phone != null) {
      const normalizedPhone = normalizePhone10(phone);
      if (!isValidPhone10(phone)) {
        return fail(res, 400, "Phone number must be exactly 10 digits");
      }

      if (normalizedPhone !== current.phone) {
        const existing = await User.findByPhone(normalizedPhone);
        if (existing && String(existing.id) !== String(req.user.id)) {
          return fail(res, 409, "Phone number already exists");
        }
      }
      patch.phone = normalizedPhone;
    }

    if (!Object.keys(patch).length) {
      return fail(res, 400, "No valid fields to update");
    }

    const updated = await User.update(req.user.id, patch);
    return ok(res, {
      message: "Profile updated successfully",
      user: toPublicUser(updated),
    });
  },
  { label: "Update Current User Error", message: "Failed to update profile" }
);

exports.updateUser = wrap(
  async (req, res) => {
    const { availableDays, name, phone, centre, isVishist } = req.body;
    const existing = await User.findById(req.params.id);

    if (!existing) {
      return fail(res, 404, "User not found");
    }

    const patch = {};
    if (name != null) patch.name = String(name).trim();
    if (phone != null) {
      if (!isValidPhone10(phone)) {
        return fail(res, 400, "Phone number must be exactly 10 digits");
      }
      patch.phone = normalizePhone10(phone);
    }
    if (centre != null) {
      const normalizedCentre = String(centre).trim();
      if (!(await isValidCentre(normalizedCentre))) {
        return fail(res, 400, "Invalid centre selected");
      }
      patch.centre = normalizedCentre;
    }
    if (availableDays != null) {
      patch.availableDays = User.normalizeAvailableDays(availableDays);
    }
    if (isVishist != null) {
      if (isMitra(existing.role)) {
        patch.isVishist = User.normalizeIsVishist(existing.role, isVishist);
      }
      // Non-Mitra: never store isVishist
    }
    if (!Object.keys(patch).length) {
      return fail(res, 400, "No valid fields to update");
    }

    const updated = await User.update(req.params.id, patch);
    return ok(res, {
      message: "User updated successfully",
      user: toPublicUser(updated),
    });
  },
  { label: "Update User Error", message: "Failed to update user" }
);

exports.deleteUser = wrap(
  async (req, res) => {
    if (!(await User.destroy(req.params.id))) {
      return fail(res, 404, "User not found");
    }
    return ok(res, { message: "User deleted successfully" });
  },
  { label: "Delete User Error", message: "Failed to delete user" }
);
