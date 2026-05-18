const express = require("express");
const router = express.Router();

const reportController = require("../controllers/report.controller");
const { verifyToken, verifyAdmin } = require("../middlewares/auth");
const upload = require("../middlewares/upload");

router.post("/", verifyToken, upload.single("image_url"), reportController.createReport);
router.get("/", verifyToken, reportController.getAllReports);
router.get("/:id", verifyToken, reportController.getReportById);
router.delete("/:id", verifyToken, reportController.deleteReport);
router.get("/admin/:id", verifyToken, verifyAdmin, reportController.getAdminReportDetail);
router.patch("/:id/status", verifyToken, verifyAdmin, reportController.updateReportStatus);
router.delete("/admin/:id", verifyToken, verifyAdmin, reportController.deleteSpamReport);


module.exports = router;
