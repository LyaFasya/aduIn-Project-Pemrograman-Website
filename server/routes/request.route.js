const express = require('express');
const router = express.Router();

const { createRequest, getAllRequests, getRequestById, updateRequestStatus, deleteRequest } = require('../controllers/request.controller');
const { verifyToken, verifyAdmin } = require('../middlewares/auth'); 
const upload = require('../middlewares/upload');

router.post('/', verifyToken, upload.single('image_url'), createRequest);
router.get('/', verifyToken, getAllRequests);

router.get('/:id', verifyToken, getRequestById);
router.patch('/:id/status', verifyToken, verifyAdmin, updateRequestStatus);
router.delete('/:id', verifyToken, deleteRequest);

module.exports = router;