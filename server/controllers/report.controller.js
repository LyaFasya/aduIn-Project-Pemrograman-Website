const cloudinaryService = require("../services/cloudinary.service");
const { Form, User, Category } = require("../models");

const createReport = async (req, res) => {
    try {
        const { title, description, location, category_id } = req.body;

        let imageUrl = null;

        if (req.file) {
            const uploadResult = await cloudinaryService.uploadImage(req.file, "report");
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

const updateStatus = async(req, res) => {
    try {
        const { id } = req.params;
        const { status} = req.body;

        await Form.update(
            { status },
            {
                where: {
                    id,
                    label: "report",
                },
            }
        );

        const updateReport = await Form.findByPk(id);

        res.status(200).json({
            message: "Status laporan berhasil diupdate",
            data: updateReport,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

module.exports = {
    createReport,
    getAllReports,
    getReportById,
    deleteReport,
    updateStatus,
};