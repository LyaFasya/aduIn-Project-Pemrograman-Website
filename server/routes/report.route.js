const express = require("express");
const router = express.Router();

const reportController = require("../controllers/report.controller");
const { verifyToken, verifyAdmin } = require("../middlewares/auth");

//User Routes
router.post("/", reportController.createReport);

router.get("/", reportController.getAllReports);

router.get("/:id", reportController.getReportById);

router.delete("/:id", reportController.deleteReport);

// ADMIN ROUTES
router.get("/admin/:id", verifyToken, verifyAdmin, reportController.getAdminReportDetail);

router.put("/:id/status", verifyToken, verifyAdmin, reportController.updateReportStatus);

router.delete("/admin/:id", verifyToken, verifyAdmin, reportController.deleteSpamReport);


module.exports = router;