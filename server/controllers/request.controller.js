const { Form } = require('../models');
const cloudinaryService = require('../services/cloudinary.service');

const createRequest = async (req, res) => {
  try {
    const { title, description, location, category_id } = req.body;
    let imageUrl = null;

    if (req.file) {
      const uploadResult = await cloudinaryService.uploadImage(req.file, "fasilitas");
      imageUrl = uploadResult.url; 
    }

    const fasilitas = await Form.create({
      user_id: req.user.id,
      category_id,
      title,
      description,
      location,
      image_url: imageUrl,
      label: 'request',
      status: 'pending'
    });

    res.status(201).json({ message: 'Pengajuan fasilitas berhasil dikirim', data: fasilitas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan saat memproses pengajuan', error: error.message });
  }
};

// ... (kode getFasilitas dan deleteFasilitas tetap sama seperti sebelumnya)

const getAllRequests = async (req, res) => {
  try {
    let condition = { label: 'request' };
    if (req.user && req.user.role !== 'admin') {
      condition.user_id = req.user.id;
    }

    const requests = await Form.findAll({ where: condition });
    res.status(200).json({ message: 'request menampilkan request berhasil', data: requests });
  } catch (error) {
    res.status(500).json({ message: 'request tidak berhasil ditampilkan', data: error.message });
  }
};

const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    let condition = { id, label: 'request' };
    if (req.user && req.user.role !== 'admin') condition.user_id = req.user.id;

    const deleted = await Form.destroy({ where: condition });

    if (!deleted) {
      return res.status(404).json({ message: 'request tidak dapat ditemukan untuk dihapus' });
    }
    res.status(200).json({ message: 'request berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'request tidak dapat dihapus', data: error.message });
  }
};

module.exports = {
  createRequest,
  getAllRequests,
  deleteRequest,
};