const { Form, User, Category } = require("../models");

const createReport = async (req, res) => {
    try {
        const report = await Form.create({
            ...req.body,
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
        const reports = await Form.findAll({
            where: {
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

        await Form.destroy({
            where: {
                id,
                label: "report",
            },
        });

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