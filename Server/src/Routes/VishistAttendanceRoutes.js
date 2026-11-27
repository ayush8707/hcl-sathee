const express = require("express");
const multer = require("multer");
const { uploadConcurrencyLimiter } = require("../Utils/uploadConcurrency");
const { authenticate, requireAdmin, requireAdminOrMitra } = require("../Middleware/auth");
const {
  getVishistAttendance,
  getDueVisits,
  markVishistAttendance,
  approveVishistAttendance,
} = require("../Controllers/VishistAttendanceController");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype?.startsWith("image/")) {
      return cb(new Error("Only image uploads are allowed"));
    }
    cb(null, true);
  },
});

router.get("/", authenticate, requireAdminOrMitra, getVishistAttendance);
router.get("/due", authenticate, requireAdminOrMitra, getDueVisits);
router.post("/", authenticate, requireAdminOrMitra, uploadConcurrencyLimiter, upload.single("photo"), markVishistAttendance);
// Only admins approve, so nobody approves a visit they recorded themselves.
router.patch("/:id/approve", authenticate, requireAdmin, approveVishistAttendance);

module.exports = router;