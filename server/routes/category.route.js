const express = require("express");
const router = express.Router();

const { getAllCategories, addCategory } = require("../controllers/category.controller");

const { verifyToken, isAdmin } = require("../middlewares/auth");

// Public: siapa saja bisa ambil daftar kategori (untuk isi dropdown form)
router.get("/", getAllCategories);

// Admin only: tambah kategori baru
router.post("/", verifyToken, isAdmin, addCategory);

module.exports = router;