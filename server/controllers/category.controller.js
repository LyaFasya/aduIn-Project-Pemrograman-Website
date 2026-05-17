const { Category } = require("../models");

const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.findAll();
        res.status(200).json({
            data: categories,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

const addCategory = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                message: "Nama kategori wajib diisi",
            });
        }

        const existingCategory = await Category.findOne({
            where: { name },
        });

        if (existingCategory) {
            return res.status(409).json ({
                message: "Kategori sudah ada",
            });
        }

        const category = await Category.create({
            name,
        });

        res.status(201).json({
            message: "Kategori berhasil ditambahkan",
            data: category,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

module.exports = {
    getAllCategories,
    addCategory,
};