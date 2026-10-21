const SiteNotice = require("../Models/SiteNotice");
const { ok, fail } = require("../Utils/httpResponse");

exports.getLoginNotice = async (_req, res) => {
  try {
    const notice = await SiteNotice.get();
    // Public endpoint: leave out who saved it.
    return ok(res, 200, { notice: notice && { message: notice.message, level: notice.level, updatedAt: notice.updatedAt } });
  } catch (err) {
    // The login page must work even if the notice cannot be read.
    console.error("Login notice read failed:", err.message);
    return ok(res, 200, { notice: null });
  }
};

exports.saveLoginNotice = async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    if (message.length > SiteNotice.MAX_MESSAGE_LENGTH) {
      return fail(res, 400, `Notice must be ${SiteNotice.MAX_MESSAGE_LENGTH} characters or fewer`);
    }
    const notice = await SiteNotice.set({
      message,
      level: req.body?.level,
      updatedBy: req.user?.email || null,
    });
    return ok(res, 200, { notice });
  } catch (err) {
    console.error("Login notice save failed:", err);
    return fail(res, 500, "Failed to save the notice");
  }
};
