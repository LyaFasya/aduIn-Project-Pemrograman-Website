const express = require("express");
const router = express.Router();

const { getAllCategories, addCategory } = require("../controllers/category.controller");

const { verifyToken, isAdmin } = require("../middlewares/auth");

router.get("/", getAllCategories);
router.post("/", verifyToken, isAdmin, addCategory);

module.exports = router;