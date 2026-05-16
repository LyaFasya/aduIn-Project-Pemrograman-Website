const express = require("express");
const router = express.Router();

const {
    createReport,
    getAllReports,
    getReportById,
    deleteReport,
    updateStatus
} = require("../controllers/report.controller");

const { verifyToken } = require("../middlewares/auth");
const upload = require("../middlewares/upload");

router.post("/", verifyToken, upload.single("image_url"), createReport);
router.get("/", verifyToken, getAllReports);
router.get("/:id", verifyToken, getReportById);
router.delete("/:id", verifyToken, deleteReport);
router.patch("/:id/status", verifyToken, updateStatus);

module.exports = router;