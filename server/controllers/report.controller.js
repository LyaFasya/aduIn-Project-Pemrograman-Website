const { Form, User, Category, FormsHistory } = require("../models");
const cloudinaryService = require("../services/cloudinary.service");

//User Operations
const createReport = async (req, res) => {
    try {
        const { title, description, location, category_id } = req.body;
        let imageUrl = null;

        if (req.file) {
            const uploadResult = await cloudinaryService.uploadImage(req.file, "reports");
            imageUrl = uploadResult.url;
        }

        const report = await Form.create({
            user_id: req.user.id,
            category_id,
            title,
            description,
            location,
            image_url: imageUrl,
            label: "report",
            status: "pending",
        });

        res.status(201).json({
            message: "Laporan berhasil dibuat",
            data: report,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

const getAllReports = async (req, res) => {
    try {
        let condition = { label: "report" };

        if (req.user && req.user.role !== "admin"){
            condition.user_id = req.user.id;
        }

        const reports = await Form.findAll({
            where: condition,
        });

        res.status(200).json({
            data: reports,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

const getReportById = async (req, res) => {
    try {
        const { id } = req.params;

        const report = await Form.findOne({
            where: {
                id,
                label: "report",
            },
            include: [
                {
                    model: User,
                    attributes: ["id", "name", "email"],
                },
                {
                    model: Category,
                    attributes: ["id", "name"],
                },
            ],
        });

        if (!report) {
            return res.status(404).json({
                message: "Halaman tidak ditemukan",
            });
        }

        res.status(200).json({
            data: report,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

const deleteReport = async (req, res) => {
    try {
        const { id } = req.params;

        let condition = {
            id,
            label: "report",
        };

        if (req.user.role !== "admin"){
            condition.user_id = req.user.id;
        }

        const deleted = await Form.destroy({
            where: condition,
        });

        if (!deleted) {
            return res.status(404).json({
                message: "Laporan tidak ditemukan"
            });
        }

        res.status(200).json({
            message: "Laporan berhasil dihapus"
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

// ADMIN OPERATIONS
const getAdminReportDetail = async (req, res) => {
    try {
        const { id } = req.params;

        const report = await Form.findOne({
            where: {
                id,
                label: "report",
            },
            include: [
                {
                    model: User,
                    attributes: ["id", "name", "email"],
                },
                {
                    model: Category,
                    attributes: ["id", "name"],
                },
                {
                    model: FormsHistory,
                    attributes: ["id", "status", "note", "updated_by", "createdAt"],
                },
            ],
        });

        if (!report) {
            return res.status(404).json({
                message: "Laporan tidak ditemukan",
            });
        }

        res.status(200).json({
            data: report,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

const updateReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, note } = req.body;
        const admin_id = req.user.id;

        const validStatus = ["pending", "process", "done", "rejected"];
        if (!validStatus.includes(status)) {
            return res.status(400).json({
                message: "Status tidak valid. Gunakan: pending, process, done, atau rejected",
            });
        }

        const report = await Form.findByPk(id);
        if (!report || report.label !== "report") {
            return res.status(404).json({
                message: "Laporan tidak ditemukan",
            });
        }

        await Form.update(
            { status },
            { where: { id, label: "report" } }
        );

        await FormsHistory.create({
            forms_request_id: id,
            status,
            note: note || null,
            updated_by: admin_id,
        });

        const updatedReport = await Form.findOne({
            where: { id },
            include: [
                {
                    model: User,
                    attributes: ["id", "name", "email"],
                },
                {
                    model: Category,
                    attributes: ["id", "name"],
                },
                {
                    model: FormsHistory,
                    attributes: ["id", "status", "note", "updated_by", "createdAt"],
                },
            ],
        });

        res.status(200).json({
            message: "Status laporan berhasil diupdate",
            data: updatedReport,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

const deleteSpamReport = async (req, res) => {
    try {
        const { id } = req.params;

        const report = await Form.findByPk(id);
        if (!report || report.label !== "report") {
            return res.status(404).json({
                message: "Laporan tidak ditemukan",
            });
        }

        await FormsHistory.destroy({
            where: { forms_request_id: id },
        });

        await Form.destroy({
            where: { id, label: "report" },
        });

        res.status(200).json({
            message: "Laporan spam berhasil dihapus",
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

module.exports = {
    //User Operations
    createReport,
    getAllReports,
    getReportById,
    deleteReport,
    //Admin Operations
    getAdminReportDetail,
    updateReportStatus,
    deleteSpamReport,
};