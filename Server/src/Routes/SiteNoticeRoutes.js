const express = require("express");
const router = express.Router();
const { getLoginNotice, saveLoginNotice } = require("../Controllers/SiteNoticeController");
const { authenticate, requireAdmin } = require("../Middleware/auth");

// Public: shown on the login page before anyone signs in.
router.get("/", getLoginNotice);
router.put("/", authenticate, requireAdmin, saveLoginNotice);

module.exports = router;
