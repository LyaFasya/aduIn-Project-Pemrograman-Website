const { Form, FormsHistory, User, Category } = require('../models');
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

const getAllRequests = async (req, res) => {
  try {
    let condition = { label: 'request' };
    if (req.user && req.user.role !== 'admin') {
      condition.user_id = req.user.id;
    }

    const requests = await Form.findAll({
      where: condition,
      include: [
        { model: User, attributes: ['id', 'name', 'email'] },
        { model: Category, attributes: ['id', 'name'] }
      ]
    });

    res.status(200).json({ message: 'Berhasil menampilkan data pengajuan', data: requests });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menampilkan data pengajuan', error: error.message });
  }
};

const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await Form.findOne({
      where: { id, label: 'request' },
      include: [
        { model: User, attributes: ['id', 'name', 'email'] },
        { model: Category, attributes: ['id', 'name'] },
        { model: FormsHistory, as: 'FormsHistories' }
      ]
    });

    if (!request) {
      return res.status(404).json({ message: 'Pengajuan fasilitas tidak ditemukan' });
    }

    res.status(200).json({ message: 'Berhasil menampilkan detail pengajuan', data: request });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menampilkan detail pengajuan', error: error.message });
  }
};

const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const validStatus = ['pending', 'process', 'done', 'rejected'];
    if (!validStatus.includes(status)) {
      return res.status(400).json({ message: `Status tidak valid. Pilih salah satu: ${validStatus.join(', ')}` });
    }

    const request = await Form.findOne({ where: { id, label: 'request' } });
    if (!request) {
      return res.status(404).json({ message: 'Pengajuan fasilitas tidak ditemukan' });
    }

    await request.update({ status });
    const history = await FormsHistory.create({
      forms_request_id: request.id,
      status,
      note: note || null,
      updated_by: req.user.id
    });

    res.status(200).json({
      message: 'Status pengajuan berhasil diperbarui',
      data: { request, history }
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memperbarui status pengajuan', error: error.message });
  }
};

const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Form.destroy({ where: { id, label: 'request' } });
    if (!deleted) {
      return res.status(404).json({ message: 'Pengajuan fasilitas tidak ditemukan' });
    }

    res.status(200).json({ message:'Pengajuan fasilitas berhasil dihapus'});
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus pengajuan fasilitas', error: error.message });
  }
};

module.exports = {
  createRequest,
  getAllRequests,
  getRequestById,
  updateRequestStatus,
  deleteRequest,
};