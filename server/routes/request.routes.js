const express = require('express');
const router = express.Router();

const { createRequest, getAllRequests, deleteRequest } = require('../controllers/request.controller');

const { verifyToken } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

router.post('/', verifyToken, upload.single('image_url'), createRequest);
router.get('/', verifyToken, getAllRequests);
router.delete('/:id', verifyToken, deleteRequest);

module.exports = router;