const express = require('express');
const router = express.Router();

const { getProfile, createProfile, updateProfile } = require('../controllers/profile.controller');
const { verifyToken } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

router.get('/', verifyToken, getProfile);
router.post('/', verifyToken, upload.single('photo'), createProfile);
router.patch('/', verifyToken, upload.single('photo'), updateProfile);

module.exports = router; 
