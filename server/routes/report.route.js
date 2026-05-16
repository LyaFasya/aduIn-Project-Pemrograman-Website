const express = require("express");
const router = express.Router();

const reportController = require("../controllers/report.controller");

router.post("/", reportController.createReport);

router.get("/", reportController.getAllReports);

router.get("/:id", reportController.getReportById);

router.get("/:id", reportController.deleteReport);

router.get("/:id/status", reportController.updateStatus);

module.exports = router;